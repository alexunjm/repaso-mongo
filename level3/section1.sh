
db.potions.find(
  {"price": {"$gt": 10, "$lt": 20}}
)

db.potions.find(
  {"vendor": {"$ne": "Brewers"}}
)
/*elementMatch trae los que al menos 1 cumple*/
db.potions.find(
  {"sizes": {"$elementMatch": {"$gt": 10, "$lt": 20}}}
)

    /*desafios*/
db.wands.find(
  {maker: "Moonsap",level_required: 5}
)
db.wands.find(
  {level_required: {"$lte": 5}}
)
db.wands.find(
  {powers: {"$ne": "Love Burst"}}
)
db.wands.find(
  {"damage.melee": {"$lte": 40, "$gte": 30}}
)
/*al menos un elemento de lengths cumpla*/
db.wands.find(
  {lengths: {"$gte": 2.5, "$lt": 3}}
)
/*todos los elementos de lengths cumplen*/
db.wands.find(
  {lengths: {"$elemMatch": {"$gte": 2.5, "$lt": 3}}}
)
db.wands.find({
    maker: {"$ne": "Foxmond"},
  level_required: {"$lte": 75},
  price: {"$lt": 50},
  lengths: {"$elemMatch": {"$gte": 3, "$lte": 4}}
})