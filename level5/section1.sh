db.potions.aggregate(
    [
        {
            "$group": {
                _id: "$vendor_id",
                total: {"$sum": 1},
                grade_total: {"$sum": "$grade"},
                avg_grade: {"$avg": "$grade"},
                max_grade: {"$max": "$grade"},
                min_grade: {"$min": "$grade"}
            }
        }
    ]
)

/*desafios*/

db.wands.aggregate(
  [
    {
      $group: { _id: "$maker"}
    }
  ]
)

db.wands.aggregate(
  [
    {
      $group: { 
        _id: "$damage.magic",
        wand_count: {"$sum": 1}
      }
    }
  ]
)

db.wands.aggregate(
  [
    {
      $group: { 
        _id: "$maker",
        total_cost: {"$sum": "$price"}
      }
    }
  ]
)


db.wands.aggregate(
  [
    {
      $group: { 
        _id: "$level_required",
        price_average: {"$avg": "$price"}
      }
    }
  ]
)


db.wands.aggregate(
  [
    {
      $group: { 
        _id: "$maker",
        total_wands: {"$sum": 1},
        max_magic: {"$max": "$damage.magic"},
        lowest_price: {"$min": "$price"}
      }
    }
  ]
)