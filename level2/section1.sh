db.potions.remove({ "name": "other"})

db.potions.update(
    { "name": "Invisibility"},
    { "$set": {name: "Invisibility2"}}
    )

/*reemplaza el documento completo*/
db.potions.update(
    { "name": "Invisibility"},
    { name: "Invisibility2"}
    )

/*cuando multi es true el update modifica todos los documentos que encuentre con la condición dada*/
db.potions.update(
    { "name": "Invisibility"},
    { "$set": {name: "Invisibility2"}},
    { "multi": true}
    )

/* la funcion $inc incrementa el valor dado en el número dicho*/
db.producto.update(
    { "name": "potion"},
    { $inc: {"cantidad": 1}}
    )

/* la funcion upsert crea el documento de nombre potion y le incrementa la cantidad en 1 en caso de que el documento no exista*/
/* sería equivalente al insert or update, ya que la segunda vez que se corre simplemente aumenta en 1 el valor cantidad del documento*/
db.producto.update(
    { "name": "potion"},
    { $inc: {"cantidad": 1}},
    { "upsert": true}
    )


    /*desafios*/
    db.wands.remove({name: "Doom Bringer"})
    db.wands.remove({powers: "Death"}, {multi: true})
db.wands.update(
    { "name": "Devotion Shift"},
    { $set: {"price": 5.99}}
    )
db.wands.update(
    { "powers": "Fire"},
    { $inc: {"level_required": 2}}
    )
db.wands.update(
    { "powers": "Fire"},
    { $inc: {"level_required": 2}},
    { "multi": true}
    )

db.logs.update(
    {name: "Dream Bender"},
    { $inc: {"count": 1}},
    { "upsert": true}
)
