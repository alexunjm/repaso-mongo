##(entrar a ver la documentación de mongo para la instalación)
sudo apt-get install -y mongodb-org

##(editar los siguientes archivos dependiendo del manual de instalación)
sudo nano /lib/systemd/system/mongod.service
sudo nano /var/lib/mongodb
sudo nano /etc/mongod.conf 

##para iniciar el servidor mongo
sudo service mongod start

##para ver el log
cat /var/log/mongodb/mongod.log

##para iniciar mongo shell
mongo

##para obtener ayuda en el shell
help

##para ver las db 
show dbs

##para ver los logs
show logs

##para ver uno en específico, show log nombreLog, así
show log global

##para entrar a una db se usa la palabra use, así:
use reviews

## para insertar un documento en la db
## si la collection potions no existe, la crea automáticamente la primera vez que se usa este comando
db.potions.insert({ "name": "Invisibility", "vendor": "Kettlecooked" })

##para ver todas los documentos de la collection potions
db.potions.find()

