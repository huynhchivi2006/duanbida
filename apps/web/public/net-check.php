<?php
// Kiểm tra hosting có kết nối ra ngoài được tới backend hay không
header('Content-Type: text/plain; charset=utf-8');
$targets = [
    ['78.154.103.20', 14602, 'Backend Wispbyte'],
    ['1.1.1.1', 443, 'Internet HTTPS (443)'],
    ['1.1.1.1', 80, 'Internet HTTP (80)'],
];
foreach ($targets as $t) {
    $start = microtime(true);
    $fp = @fsockopen($t[0], $t[1], $errno, $errstr, 5);
    $ms = round((microtime(true) - $start) * 1000);
    echo str_pad($t[2], 25) . " {$t[0]}:{$t[1]} => " . ($fp ? "OK ({$ms}ms)" : "FAIL: $errstr ($errno)") . "\n";
    if ($fp) fclose($fp);
}

