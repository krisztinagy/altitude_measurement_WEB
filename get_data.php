<?php
$myfile = fopen("GPS_CORR.txt", "a+") or die("Unable to open file!");

fwrite($myfile, $_POST['date'].",".$_POST['time'].",". $_POST['altitude'].",".PHP_EOL);

fclose($myfile);
?>