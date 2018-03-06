
db.logs.update(
    {},/*selecciona todos los documentos*/
    { $inc: {"count": 1}},
    { "upsert": true}
)

db.potions.update(
    {},
    { "$rename": {name: "nombre"}}/*renombra la key del documento con clave name y la cambia por nombre*/
    )

{
    _id: ObjectId("1234"),
    name: "Shrinking",
    vendor: "alex",
    score: 94,
    ingredients: ["uno", "dos", "tres", "cuatro"]
}

db.potions.update(
    {},
    { "$set": {ingredients.1: "dos_renombrado"}}/*los índices comienzan en 0 y acá cambiaría el ingredient "dos", por "dos_renombrado"*/
    )

/*cuando no sabemos el índice en el array se hace así*/
db.potions.update(
    { ingredients: "dos"},
    { "$set": {"ingredients.$": "dos_renombrado"}},
    { multi: true} /*para que actualice todos los ingredientes de todos los documentos de la coleccion potions*/
    )

{
    name: "Invisibility"
    categories: ["tasty", "effective"]
}

/*quitar el último elemento de un array*/
db.potions.update(
    { "name": "Invisibility"},
    { $pop: {categories: 1}} /* 1 quita el último, -1 quita el primero*/
    )

/*agregar un nuevo elemento al array*/
db.potions.update(
    { "name": "Invisibility"},
    { $push: {categories: "nuevo"}} 
    )

/*agregar un nuevo elemento al array, pero no lo agrega si ya existe en el array*/
db.potions.update(
    { "name": "Invisibility"},
    { $addToSet: {categories: "nuevo"}} 
    )

/*borra de todos los documentos, el elemento en el array si existe en el array*/
db.potions.update(
    { "name": "Invisibility"},
    { $pull: {categories: "nuevo"}} /*quita cualquiera instancia de un valor del array*/
    )

    /*desafios*/
    /*Add the update parameter that will remove the smell field from all documents.*/
db.wands.update(
  {},
  {$unset: {smell: ""}},
  {"multi": true}
)
db.wands.update(
  {},
  {$rename: {creator: "maker"}},
  {"multi": true}
)
db.wands.update(
  {"name": "Dream Bender"},
    { "$set": {"powers.0": "Fire Deflection"}}
)
db.wands.update(
  {"powers": "Love"},
    { "$set": {"powers.$": "Love Burst"}},
  {"multi": true}
)

db.wands.update(
  {"name": "Dream Bender"},
    { $push: {powers: "Spell Casting"}} 
)
db.wands.update(
  {},
    {$addToSet: {powers: "Spell Casting"}},
  {"multi": true}
)

db.wands.update(
  {},
  {$mul: {"damage.melee": 10}},
  {multi: true}
)