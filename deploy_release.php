<?php

exec("pwd", $op, $v);
echo "Output:<br/>";
print_r($op);
echo "<br/>";
echo "return_var<br/>:";
print_r($v);

echo "<br/><br/>";

exec("rm -rf /home/komplexixw/www/public/kfs_release", $op, $v);

echo "Output:<br/>";
print_r($op);
echo "<br/>";
echo "return_var<br/>:";
print_r($v);

echo "<br/><br/>";

exec("git clone -b release https://github.com/komplexitaeter/kfs /home/komplexixw/www/public/kfs_release");
//exec("rm -rf kfs_release/.git");
//exec("rm -rf kfs_release/.idea");
echo "Output:<br/>";
print_r($op);
echo "<br/>";
echo "return_var<br/>:";
print_r($v);


//echo shell_exec("rm -rf kfs_release");
//print_r($op);
//exec("git clone -b release https://github.com/komplexitaeter/kfs kfs_release");
//exec("rm -rf kfs_release/.git");
//exec("rm -rf kfs_release/.idea");