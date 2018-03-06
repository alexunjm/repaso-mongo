
db.wands.find({
    maker: {"$ne": "Foxmond"},
  level_required: {"$lte": 75},
  price: {"$lt": 50},
  lengths: {"$elemMatch": {"$gte": 3, "$lte": 4}}
},{maker: true})/*solo trae maker de cada documento que cumpla de toda la coleccion*/

/* trae todos los campos que cumplan con la condición, excepto maker*/
db.wands.find({
    maker: {"$ne": "Foxmond"},
  level_required: {"$lte": 75},
  price: {"$lt": 50},
  lengths: {"$elemMatch": {"$gte": 3, "$lte": 4}}
},{maker: false})
/*no se puede usar una combinación de inclusión y exclusión, o todos false o todos true*/


db.potions.find().count()
db.potions.find().sort(_id: -1)/*descendente*/
db.potions.find().limit(3)/*límite de 3*/
db.potions.find().skip(3).limit(3)/*comienza en la posición 3, límite de 3*/


    /*desafios*/
db.wands.find({}, {name: true}).sort({name: 1})
db.wands.find({},{name:1, powers:1, _id:0})
db.wands.find({level_required:2}).count()
db.wands.find({}).sort({price:-1}).limit(3)