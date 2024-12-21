/etc/sysctl.conf 文件中修改 。例：net.ipv4.【参数】 net.ipv4.tcp_tw_reuse = 1
【参数】
tcp_tw_reuse = 1 #是否允许将 TIME-WAIT 的 sockets 用于新的连接，高并发时开启可提高性能默认值是0
ip_local_port_range =1024 65535 #主动连接其他服务时可用的端口范围，默认值是（32768 61000）
tcp_max_tw_buckets = 180000 #系统能同时处理的最大 TIME-WAIT sockets 数，超过此数将立即丢弃。可以调小以抵御DOS攻击
tcp_max_syn_backlog =65536 #允许的最大tcp连接请求数，还没有被客户端消费的tcp
net.core.somaxconn = 128 #socket 监听的backlog数上限，backlog是socket的监听队列，socket server会一次性处理backlog中所有请求