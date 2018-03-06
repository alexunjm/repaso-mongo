/**
 * Ejemplo de resumen facturas de un usuario específico
 * saldo suma el ahorro si el estado es 2
 * saldo1 suma el ahorro si el estado es 2 y el ahorro es mayor a 0
 * facturas es la cantidad de facturas que estan en estado menor a 2 o mayor a 3
 */
db.getCollection('invoices').aggregate([
	{$match: {usuario_id: ObjectId('5762d65f85b37cfd3d2e2cd2')}},
	{$group: {
			_id: null,
			saldo: {$sum: {$cond: [{$eq: ['$estado', 2]}, '$ahorro', 0]}},
			saldo1: {
				$sum: {
					$cond: [{ $and: [ {$eq: ['$estado', 2]}, {$gt: ['$ahorro', 0]} ] }, '$ahorro', 0]
				}
			},
			facturas: {
				$sum: {$cond: [
					{$or: [
						{$lt: ['$estado', 2]},
						{$gt: ['$estado', 3]}
					]}, 1, 0
					]
				}
			}
		}
	}
])