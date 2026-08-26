<?php
require_once 'd:/WORK/XAMPP/htdocs/omni/wp-load.php';
global $wpdb;

echo "=== TABLES ===\n";
$tables = $wpdb->get_col("SHOW TABLES");
foreach ($tables as $t) {
    if (strpos($t, 'vtp') !== false || strpos($t, 'apbd') !== false || strpos($t, 'omni') !== false) {
        echo "$t\n";
    }
}

echo "\n=== VTP POSTMETA SAMPLE ===\n";
$sample_meta = $wpdb->get_results("SELECT DISTINCT meta_key FROM {$wpdb->postmeta} WHERE meta_key LIKE '%vtp%' LIMIT 30");
foreach ($sample_meta as $m) {
    echo $m->meta_key . "\n";
}
