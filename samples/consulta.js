db.users.find({"$where": "this.createdAt=this.updatedAt", gender: "f"}).limit(1).pretty()
