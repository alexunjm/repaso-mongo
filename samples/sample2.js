const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment-timezone');

var users = require('./users');
var notification = require('../notification');
var mdb = require('../mdb');

moment.locale('es');

const bancos = {
	1040: 'Banco Agrario',
	1052: 'Banco AV Villas',
	1013: 'Banco BBVA Colombia S.A.',
	1032: 'Banco Caja Social',
	1019: 'Banco Colpatria',
	1066: 'Banco Cooperativo CoopCentral',
	1006: 'Banco CORPBANCA S.A.',
	1051: 'Banco Davivienda',
	1001: 'Banco de Bogotá',
	1023: 'Banco de Occidente',
	1062: 'Banco Falabella',
	1012: 'Banco GNB Sudameris',
	1060: 'Banco Pichincha S.A.',
	1002: 'Banco Popular',
	1058: 'Banco PROCREDIT',
	1007: 'Bancolombia',
	1061: 'BANCOOMEVA S.A.',
	1009: 'CITIBANK',
	1014: 'Helm Bank S.A.'
};

/*************************************************************************************************/

module.exports = {
	assign: function (id, callback) {	// Asignar factura
		var res;
		var decrementar = 0;

		async.waterfall([
			function (cb) {	// Obtiene número de facturas pendientes y primera pendiente
				async.parallel({	// Número de facturas pendientes
					pendientes: function (_cb) {
						mdb.db.collection('invoices').count({ estado: 0 }, _cb);
					},
					// Ciudades
					ciudades: function (_cb) {
						mdb.db.collection('cities').find({}).toArray(_cb);
					},

					factura: function (_cb) {	// Obtiene la factura en proceso actual del usuario
						mdb.db.collection('invoices').findOne({
							estado: -1,
							procesador_id: new ObjectId(id)
						}, {
								nombre_establecimiento: true,
								ciudad: true,
								nit: true,
								factura_numero: true,
								fecha_factura: true,
								imagenes: true,
								creada: true
							}, function (err, result) {
								if (err) {
									_cb(err);
									return;
								}
								if (result) {
									_cb(null, result);
									return;
								}	// Si no tiene en proceso, se obtiene la primera pendiente
								decrementar++;
								mdb.db.collection('invoices').findOne({ estado: 0 }, {
									nombre_establecimiento: true,
									ciudad: true,
									nit: true,
									factura_numero: true,
									fecha_factura: true,
									imagenes: true,
									creada: true
								}, _cb);
							});
					}
				}, cb);
			},

			function (results, cb) {	// Guarda factura en memoria antes de retornarla
				if (results.factura) {
					res = results.factura;
					res.pendientes = results.pendientes - decrementar;
					res.ciudades = results.ciudades;
					cb(null);
					return;
				}

				cb(new Error('No hay facturas en el momento'));
			},

			function (cb) {	// Actualiza estado de factura a en proceso
				mdb.db.collection('invoices').updateOne({ _id: res._id }, {
					$set: {
						estado: -1,
						procesador_id: new ObjectId(id)
					}
				}, cb);
			},

			function (results, cb) {	// Finalmente retorna la factura
				cb(null, res);
			}
		], callback);
	},

	decline: function (data, callback) {	// Declinar factura
		var r = { _id: new ObjectId(data.id) };

		async.waterfall([
			function (cb) {	// Busca el id de usuario para la notificación
				mdb.db.collection('invoices').findOne(r, { usuario_id: true }, cb);
			},

			function (result, cb) {
				var now = moment().tz('America/Bogota');
				pushMessage = {
					user_id: result.usuario_id,
					message: 'Su factura ha sido rechazada'
				};

				async.parallel([
					function (cb_p) {	// Actualiza la factura
						var m = now.format('MMMM');

						mdb.db.collection('invoices').updateOne(r, {
							$set: {
								estado: 1,
								estado_txt: data.razon,
								fecha: {
									a: now.format('YYYY'),
									m: m.charAt(0).toUpperCase() + m.slice(1),
									d: now.format('D'),
									h: now.format('h:mm a')
								}
							}
						}, cb_p);
					},

					function (cb_p) {	// Crea la notificación
						mdb.db.collection('notifications').insertOne({
							usuario_id: result.usuario_id,
							descripcion: pushMessage.message,
							tipo: 0,
							ruta: 'r',
							fecha: now.toDate()
						}, cb_p);
					},

					function (cb_p) {	// Envia mensaje push
						users.prepare_notification(pushMessage, function (err, pushData) {
							notification.send(pushData.title, pushData.message, pushData.clientid, cb_p);
						});
					}
				], cb);
			}
		], callback);
	},

	escalate: function (data, callback) {	// Escalar factura
		var now = moment().tz('America/Bogota');
		var m = now.format('MMMM');

		mdb.db.collection('invoices').updateOne({ _id: new ObjectId(data.id) }, {
			$set: {
				estado: 4,
				estado_txt: data.razon,
				fecha: {
					a: now.format('YYYY'),
					m: m.charAt(0).toUpperCase() + m.slice(1),
					d: now.format('D'),
					h: now.format('h:mm a')
				}
			}
		}, callback);
	},

	add_info: function (data, callback) {	// Agregar info a factura
		var _id = new ObjectId(data.id);
		delete data.id;

		mdb.db.collection('invoices').updateOne({ _id: _id }, { $set: data }, callback);
	},

	coupons: function (id, callback) {	// Cupones de factura
		async.waterfall([
			function (cb) {	// Obtiene la lista de cupones de la factura actual
				mdb.db.collection('invoices').findOne({ _id: new ObjectId(id) }, { cupones: true }, cb);
			},

			function (result, cb) {	// Obtiene la info de los cupones
				mdb.db.collection('coupons').find({ _id: { $in: result.cupones } }, {
					nombre_cupon: true,
					detalles: true,
					ahorro: true,
					precio_min: true,
					precio_max: true,
					redimibles_x_factura: true
				}).toArray(cb);
			},

			function (cupones, cb) {	// Obtiene la info adicional de los cupones
				async.map(cupones, function (cupon, cbmap) {
					cupon.redimibles_x_factura = cupon.redimibles_x_factura ? (Number(cupon.redimibles_x_factura) + 1) : 31;
					var query = [
						{
							$match: {
								estado: 3,
								detalle_cupones: {
									$elemMatch: { _id: cupon._id.toHexString() }
								}
							}
						}, {
							$project: {
								_id: 0,
								detalle_cupones: 1,
							}
						}, {
							$unwind: "$detalle_cupones"
						}, {
							$group: {
								_id: '$detalle_cupones._id',
								total_facturas: { $sum: 1 },
								total_cupones: { $sum: '$detalle_cupones.cantidad' }
							}
						}, {
							$match: { _id: cupon._id.toHexString() }
						}];
					mdb.db.collection('invoices').aggregate(query).toArray(function (err, res) {
						if (cupon.cantidad_cupones && res) {
							var cupones_redimibles = Number(cupon.cantidad_cupones) - Number(res.total_cupones) + 1;
							cupon.redimibles_x_factura = cupones_redimibles < cupon.redimibles_x_factura ? cupones_redimibles : cupon.redimibles_x_factura;
						}
						cbmap(null, cupon);
					});
				}, cb);
			},
		], callback);

	},

	approve: function (data, callback) {	// Aprobar factura
		var r = { _id: new ObjectId(data.id) };
		var pushMessage = {};

		async.waterfall([
			function (cb) {	// Busca el id de usuario para la notificación
				mdb.db.collection('invoices').findOne(r, { usuario_id: true }, cb);
			},

			function (result, cb) {
				var now = moment().tz('America/Bogota');
				pushMessage.user_id = result.usuario_id;
				pushMessage.message = 'Su factura ha sido aprobada';

				async.parallel([
					function (cb_p) {	// Actualiza la factura
						var m = now.format('MMMM');

						mdb.db.collection('invoices').updateOne(r, {
							$set: {
								estado: data.estado || 2,
								estado_txt: data.estado_txt || 'Factura aprobada',
								ahorro: parseInt(data.ahorro),
								valor_compra: parseInt(data.valor_compra),
								detalle_cupones: data.detalle_cupones,
								fecha: {
									a: now.format('YYYY'),
									m: m.charAt(0).toUpperCase() + m.slice(1),
									d: now.format('D'),
									h: now.format('h:mm a')
								}
							}
						}, cb_p);
					},

					function (cb_p) {	// Crea la notificación
						mdb.db.collection('notifications').insertOne({
							usuario_id: pushMessage.user_id,
							descripcion: pushMessage.message,
							tipo: 1,
							ruta: 'r',
							fecha: now.toDate()
						}, cb_p);
					},

					function (cb_p) {	// Envia mensaje push
						users.prepare_notification(pushMessage, function (err, pushData) {
							notification.send(pushData.title, pushData.message, pushData.clientid, cb_p);
						});
					}
				], cb);
			}
		], callback);
	},

	stats: function (callback) {	// Cuenta facturas
		mdb.db.collection('invoices').aggregate({
			$group: {
				_id: null,
				total: { $sum: 1 },
				declinadas: { $sum: { $cond: [{ $eq: ['$estado', 1] }, 1, 0] } },
				aprobadas: { $sum: { $cond: [{ $eq: ['$estado', 2] }, 1, 0] } },
				redimidas: { $sum: { $cond: [{ $eq: ['$estado', 3] }, 1, 0] } }
			}
		}, callback);
	},

	category: function (callback) {
		var result = {};
		async.waterfall([
			function (cb_invoices) {
				mdb.db.collection('invoices').aggregate([{
					$match: { "ahorro": { $gt: 0 } }
				}, {
					$group: {
						_id
					}
				}], cb_invoices);

			},

			function (invoices, cb_complements) {
				async.map(invoices, function (invoice, cb_map) {
					async.parallel({
						usuario: function (cb_parallel) {
							mdb.db.collection('users').findOne({ _id: invoice.usuario_id }, {
								nombres: true,
								apellidos: true
							}, cb_parallel);
						},

						cupones: function (cb_parallel) {
							mdb.db.collection('coupons').find({ _id: { $in: invoice.cupones } }, {
								nombre_cupon: true,
								ahorro: true,
								precio_min: true,
								precio_max: true,
								inicia: true,
								vence: true
							}).toArray(cb_parallel);
						},

						procesador: function (cb_parallel) {
							mdb.db.collection('bo_users').findOne({ _id: invoice.procesador_id }, { email: true }, cb_parallel);
						}
					}, function (err, data) {
						if (err) {
							cb_map(err);
							return;
						}
						invoice.usuario = data.usuario;
						invoice.cupones = data.cupones;
						invoice.procesador = data.procesador;
						cb_map(null, invoice);
					});
				}, function (err, data) {
					if (err) {
						cb_complements(err);
						return;
					}
					result.data = data;
					cb_complements(null, result);
				});
			}
		], callback);
	},

	table: function (params, callback) {	// Genera datos para datatable
		var result = { draw: parseInt(params.draw) };
		async.waterfall([
			function (cb) {
				mdb.db.collection('invoices').count(cb);
			},

			function (count, cb) {
				var i;

				result.recordsTotal = count;

				var query = { estado: { $ne: 0 } };

				for (i = 0; i < 16; i++) {
					var val = params[`columns[${i}][search][value]`];
					if (val) {
						if (i > 3) {
							try {
								val = new RegExp(val, 'i');
							} catch (err) {
								result.error = err.message;
								val = /.*/;
							}
						}
						if (i === 1) {
							try {
								query._id = new ObjectId(val);
							} catch (err) { }
						} else if (i === 3) {
							query.estado = parseInt(val);
						} else if (i === 9) {
							query.nombre_establecimiento = { $regex: val };
						} else if (i === 10) {
							query.ciudad = { $regex: val };
						} else if (i === 11) {
							query.nit = { $regex: val };
						} else if (i === 12) {
							query.factura_numero = { $regex: val };
						}
						break;
					}
				}

				if (i === 16) {
					result.recordsFiltered = count;
					cb(null, query);
					return;
				}
				mdb.db.collection('invoices').find(query).count(function (err, recordsFiltered) {
					if (err) {
						cb(err);
						return;
					}
					result.recordsFiltered = recordsFiltered;
					cb(null, query);
				});
			},

			function (query, cb) {
				mdb.db.collection('invoices').find(query).sort({ _id: -1 }).limit(parseInt(params.length)).skip(parseInt(params.start)).toArray(cb);
			},

			function (results, cb) {
				async.map(results, function (invoice, cb_m) {
					async.parallel({
						usuario: function (cb_p) {
							mdb.db.collection('users').findOne({ _id: invoice.usuario_id }, {
								nombres: true,
								apellidos: true
							}, cb_p);
						},

						cupones: function (cb_p) {
							mdb.db.collection('coupons').find({ _id: { $in: invoice.cupones } }, {
								nombre_cupon: true,
								detalles: true,
								ahorro: true,
								precio_min: true,
								precio_max: true,
								inicia: true,
								vence: true
							}).toArray(cb_p);
						},

						procesador: function (cb_p) {
							mdb.db.collection('bo_users').findOne({ _id: invoice.procesador_id }, { email: true }, cb_p);
						}
					}, function (err, data) {
						if (err) {
							cb_m(err);
							return;
						}
						cb_m(null, [null, // 0
							invoice._id.toHexString(), // 1
							data.usuario, // 2
							{
								num: invoice.estado,
								txt: invoice.estado_txt,
								auditor: params.rolAuditor,
								invoice: invoice
							}, // 3
							invoice.imagenes, // 4
							data.cupones, // 5
							invoice.creada, // 6
							data.procesador, // 7
							invoice.fecha, // 8
							invoice.nombre_establecimiento, // 9
							invoice.ciudad, // 10
							invoice.nit, // 11
							invoice.factura_numero, // 12
							invoice.fecha_factura, // 13
							invoice.ahorro, // 14
							invoice.valor_compra // 15
						]);
					});
				}, function (err, data) {
					if (err) {
						cb(err);
						return;
					}
					result.data = data;
					cb(null, result);
				});
			}
		], callback);
	},

	deredeem: function (data, callback) {	// Des-asocia una factura de una redención
		var _id = new ObjectId(data.id);
		delete data.id;

		var updt = {
			$set: data,
			$unset: { redencion: '' }
		};

		async.waterfall([
			function (cb) {	// Obtiene la redención de la factura actual
				mdb.db.collection('invoices').findOne({ _id: _id }, { redencion: true }, cb);
			},

			function (invoice, cb) {	// Obtiene la redención
				var fnd = { monto: true };
				if (data.estado != 3) {
					fnd.facturas = true
				}
				mdb.db.collection('redemptions').findOne({ _id: invoice.redencion }, fnd, cb);
			},

			function (redemption, cb) {	// Actualiza la redención
				if (data.estado != 3) {
					data.ahorro = 0;
				}
				var red_updt = { $set: { monto: redemption.monto - (parseInt(data.ahorro_ant) - data.ahorro) } };

				delete data.ahorro_ant;

				if (red_updt.$set.monto < 1) {
					mdb.db.collection('redemptions').deleteOne({ _id: redemption._id }, cb);
					return;
				}
				if (data.estado != 3) {
					var idx = 0;
					for (idx; idx < redemption.facturas.length; idx++) {
						if (_id.equals(redemption.facturas[idx])) {
							break;
						}
					}
					redemption.facturas.splice(idx, 1);
					red_updt.$set.facturas = redemption.facturas

				} else {
					delete updt.$unset;
				}
				mdb.db.collection('redemptions').updateOne({ _id: redemption._id }, red_updt, cb);
			},

			function (ignore, cb) {	// Actualiza la factura
				mdb.db.collection('invoices').updateOne({ _id: _id }, updt, callback);
			}
		], callback);
	},

	export: function (columns, callback) {
		var query = { estado: { $gt: 0 } };

		for (var i = 0; i < 16; i++) {
			var val = columns[i].search.value;
			if (val) {
				if (i > 3) {
					try {
						val = new RegExp(val, 'i');
					} catch (err) {
						result.error = err.message;
						val = /.*/;
					}
				}
				if (i === 1) {
					try {
						query._id = new ObjectId(val);
					} catch (err) { }
				} else if (i === 3) {
					query.estado = parseInt(val);
				} else if (i === 9) {
					query.nombre_establecimiento = { $regex: val };
				} else if (i === 10) {
					query.ciudad = { $regex: val };
				} else if (i === 11) {
					query.nit = { $regex: val };
				} else if (i === 12) {
					query.factura_numero = { $regex: val };
				}
				break;
			}
		}
		mdb.db.collection('invoices').find(query).sort({ _id: -1 }).toArray(function (err, results) {
			if (err) {
				callback(err);
				return;
			}
			async.mapSeries(results, function (invoice, cb) {
				var rtn = [invoice._id.toHexString()];

				async.parallel({
					usuario: function (_cb) {
						mdb.db.collection('users').findOne({ _id: invoice.usuario_id }, _cb);
					},

					procesador: function (_cb) {
						mdb.db.collection('bo_users').findOne({ _id: invoice.procesador_id }, { email: true }, _cb);
					}
				}, function (err, pr) {
					if (err) {
						cb(err);
						return;
					}
					try {
						if (!pr.usuario) {
							pr.usuario = {
								nombres: '',
								apellidos: '',
								tipodoc: '',
								cedula: '',
								email: '',
								celular: '',
								banco: '',
								tipocuenta: null,
								numcuenta: ''
							}
						}
						rtn.push(pr.usuario.nombres);
						rtn.push(pr.usuario.apellidos);
						rtn.push(pr.usuario.tipodoc);
						rtn.push(pr.usuario.cedula);
						rtn.push(pr.usuario.email);
						rtn.push(pr.usuario.celular);
						rtn.push(bancos[pr.usuario.banco]);
						rtn.push(pr.usuario.tipocuenta ? pr.usuario.tipocuenta.charAt(0) + pr.usuario.tipocuenta.substr(1).toLowerCase() : null);
						rtn.push(pr.usuario.numcuenta);
						rtn.push(invoice.estado === -1 ? 'En Proceso' : (invoice.estado === 1 ? 'Declinada' : (invoice.estado === 2 ? 'Aprobada' : (invoice.estado === 3 ? 'Redimida' : 'Escalada'))));
						rtn.push(invoice.imagenes.map(function (imagen) {
							return `https://s3-us-west-2.amazonaws.com/proyectox/facturas/${invoice._id}/${imagen}`;
						}).join("\n"));
						rtn.push(invoice.cupones.map(function (cupon) {
							return `https://back-office.proyectox.com/admin/cupon/${cupon}`;
						}).join("\n"));
						rtn.push(`${invoice.creada.m} ${invoice.creada.d} / ${invoice.creada.a} ${invoice.creada.h}`);
						rtn.push(pr.procesador ? (pr.procesador.email.substr(0, pr.procesador.email.indexOf('@'))) : 'sin procesador');
						rtn.push(`${invoice.fecha.m} ${invoice.fecha.d} / ${invoice.fecha.a} ${invoice.fecha.h}`);
						// rtn.push(invoice.fecha ? `${invoice.fecha.m} ${invoice.fecha.d} / ${invoice.fecha.a} ${invoice.fecha.h}` : '');
						rtn.push(invoice.nombre_establecimiento);
						rtn.push(invoice.ciudad);
						rtn.push(invoice.nit);
						rtn.push(invoice.factura_numero);
						rtn.push(invoice.fecha_factura);
						rtn.push(invoice.ahorro);
						rtn.push(invoice.valor_compra);
						cb(null, rtn);
					} catch (e) {
						console.log(invoice._id.toHexString());
						console.log(e);
						cb(new Error('No se logró encontrar toda la'
							+ ' información relacionada a la factura ' + invoice._id.toHexString()));
					}
				});
			}, callback);
		});
	}
};
