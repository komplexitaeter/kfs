<?php

$op=[];
echo exec("rm -rf kfs_release", $op);
print_r($op);
//exec("git clone -b release https://github.com/komplexitaeter/kfs kfs_release");
//exec("rm -rf kfs_release/.git");
//exec("rm -rf kfs_release/.idea");