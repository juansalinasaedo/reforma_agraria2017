<?php //archivo de conexion base de datos
$link = mysql_connect("dbases.utalca.cl","semutal","semi2009") or die(mysql_error()); 
mysql_select_db("seminarios",$link);
?>