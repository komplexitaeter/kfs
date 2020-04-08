<?php

echo exec("pwd", $op, $v);
echo "Error:<br/>";
print_r($op);
echo "<br/>";
echo "return_var<br/>";
print_r($v);
//echo shell_exec("rm -rf kfs_release");
//print_r($op);
//exec("git clone -b release https://github.com/komplexitaeter/kfs kfs_release");
//exec("rm -rf kfs_release/.git");
//exec("rm -rf kfs_release/.idea");