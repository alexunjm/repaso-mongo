db.potions.find({name: "Invisibility"})

db.potions.insert({ "name": "other", "vendor": "Kettlecooked" })
db.potions.insert({ "name": "another one", "vendor": "Kettlecooked" })

db.potions.find({"vendor": "Kettlecooked"})

db.wands.find({name: "Storm Seeker"})

db.wands.find({creator: "Moonsap"})

db.wands.insert({
  "name": "Dream Bender",
  "creator": "Foxmond",
  level_required: 10,
  price: 34.9,
  powers: ["Fire", "Love"],
  damage: {"magic": 4, "melee": 2}
}
)

db.wands.find({powers: "Fire"})