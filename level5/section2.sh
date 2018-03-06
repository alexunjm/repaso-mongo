
db.potions.aggregate(
  [
    {"$match": {ingredients: "unicorn"}},
    {
      $group: { 
        _id: "$vendor_id",
        potion_count: {"$sum": 1}
      }
    }
  ]
)

db.potions.aggregate(
  [
    {"$match": {price: {"$lt": 15}}},
    {"$project": {_id:false, vendor_id:true, grade: true},
    {
      $group: { 
        _id: "$vendor_id",
        avg_grade: {"$avg": "$grade"}
      }
    },
    {"$sort": {avg_grade: -1}},
    {"$limit": 3}
  ]
)

db.wands.aggregate(
[
  {"$match":
    {powers: "Air Bolt"}
  },
  {"$group":
    {_id: "$maker",
    "lowest_level": {"$min": "$level_required"}
    }
  }
]
)


db.wands.aggregate(
[
  {"$match":
    {price: {"$lt":50}}
  },
  {"$group":
    {_id: "$maker",
    "average_magic": {"$avg": "$damage.magic"}
    }
  },
  {"$match":
    {average_magic: {"$gt":40}}
  },
]
)


db.wands.aggregate(
[
  {"$match":
    {level_required: {"$lt":5}}
  },
  {"$project":
   {_id: 0, maker:1, "damage.magic":1}
  },
  {"$group":
    {_id: "$maker",
    "max_damage": {"$max": "$damage.magic"}
    }
  },
  {"$sort":
    {max_damage: -1}
  },
  {"$limit":4
  },
]
)