124 222 28 230
1、k8s中镜像下载策略有哪几种
Always、Nerver、IfNotPresent

2、k8s中pod是如何实现代理和负载均衡？
通过创建service资源，通过label标签匹配到后端的pod，代理pod，实现pod的负载均衡。

3、service的4种类型？
ClusterIP:
默认值，k8s系统给service自动分配的虚拟IP，只能在集群内部访问,集群内部使用的ip（默认类型，只能集群内部访问）。

NodePort：
对外暴露应用，通过访问node节点的ip和端口可以访问到对应应用（集群外访问）,将Service通过指定的Node上的端口暴露给外部，访问任意一个NodeIP:nodePort都将路由到ClusterIP。

Loadbalancer： （升级版的nodePort）
对外暴露应用（适用于公有云），在 NodePort 的基础上，借助 cloud provider 创建一个外部的负载均衡器，并将请求转发到 < NodeIP >:NodePort，此模式只能在云服务器上使用。

ExternalName：
ExternalName类型的Service，就是将该Service名跟集群外部服务地址做一个映射，使之访问Service名称就是访问外部服务。

4、service两种代理模式？
两种代理模式： iptables（默认）和ipvs模式。

Iptables: 通过iptables规则进行转发代理。

Ipvs：使用了类似lvs负载均衡技术，使用rr轮询模式进行转发代理。

Iptables模式和ipvs模式可以互相转换。

5、k8s提供了哪几种对外暴露访问方式？
Nodeport方式： 通过node节点的ip和暴露端口，提供外部访问

Loadbalance模式：适用于云产品厂商进行暴露访问。

Ingress模式：通过提供域名，代理分流不同域名进行各自访问。

6、k8s中网络通信类型有几种？
1).同一个pod中的多个容器间的通信

2).pod之间的通信，从一个pod到另一个pod之间的通信

3).pod与service通信： pod的ip到cluserIP的通信

4).和外部通信： 集群和外部客户端的通信，可通过nodePort或ingress暴露出访问地址

7、pod网络连接超时的几种情况？
1).pod和pod之间的连接超时（不分跨不跨宿主机）

解决排查：查看calico或flannel网络是否是running，查看calico或flannel网络组件的日志，提取重要信息，查看pod网段和宿主机网段是否重合（不能让其重合）

2).pod和虚拟主机（宿主机）的服务器连接超时

解决排查：检查pod网络，能否ping通同网段pod的ip

3).pod和外网连接超时

解决排查：检查物理网络，在容器内ping外网域名或其他pod的ip，如: [www.baidu.com，不通时可抓包测试](http://www.baidu.xn--com,-jb5f86x1tby43d5mgnxtdi3fuyk/)

8、k8s的几种调度方式？
1).scheduler的预选和优选，选择合适node节点调度

预选：通过资源不足问题，过滤掉一些不符合要求的node节点，如：资源request不符。

优选：调度考虑整体的优化，如：多个副本尽量分布到不同的主机节点上，负载均衡。

2).通过定义nodeName或nodeSelector标签选择器进行调度

3).可以根据节点亲和性nodeAffinity进行调度

节点亲和性： nodeAffinity，作用和nodeSelector一样，但更灵活，有软策略和硬策略

9、标签及标签选择器是什么，作用是什么？
标签：k8s中的标签(Labels)是键值对，用于对资源对象进行分类和标识。

标签作用：通过为资源对象添加标签，可以更灵活地组织和管理它们，例如根据标签进行筛选、分组或标记不同的用途。

标签选择器(Label Selectors): 根据标签的键值对来选择特定的资源对象。

标签选择器作用：使用标签选择器，可以根据标签的值对资源进行过滤、查询或操作。

10、deployment怎么扩容或缩容？
1).直接修改pod副本数即可，可以通过下面的方式来修改pod副本数：

直接修改yaml文件的replicas字段数值，然后kubectl apply -f xxx.yaml来实现更新；

2).使用kubectl edit deployment xxx 修改replicas来实现在线更新；

使用kubectl scale --replicas=5 deployment/deployment-nginx命令来扩容缩容。

11、如何进行应用程序的水平扩展？
可以使用Deployment的副本数字段来进行水平扩展。通过增加副本数，Kubernetes会创建更多的Pod副本以应对负载增加。

12、什么是Service？
Service是Kubernetes的抽象层，用于暴露应用程序的一组Pod。它为这些Pod提供稳定的网络终结点，并允许它们通过服务发现进行通信。

13、什么是Pod的探针（Probe）？
Pod的探针用于定期检查容器的健康状态。Kubernetes支持三种类型的探针：存活探针（Liveness Probe）、就绪探针（Readiness Probe）和启动探针（Startup Probe）。

14、Kubernetes中如何实现故障转移和自动恢复？
Kubernetes 提供了多种机制来实现故障转移和自动恢复。

包括：控制器对象（如 ReplicaSet、Deployment）、自动重启和健康检查、控制平面自我修复的高可用性以及水平扩展和负载均衡。

ReplicaSet：是k8s中的控制器对象，用于确保应用程序的副本数量始终保持在设定的期望值。如果某个Pod 发生故障或终止，控制器会自动启动新的Pod，以确保达到配置的副本数量。

Deployment: 是k8s中的一种高级控制器，建立在 ReplicaSet 之上，提供了应用部署、更新和滚动回滚的功能。Deployment可以指定Pod的副本数量，并且支持自动故障恢复。

健康检查机制： 通过 livenessProbe和readinessProbe可以定期检查容器的健康状态。如果容器失败(例如，由于应用程序崩溃或无响应)，Kubernetes将自动重启该容器。

控制平面自我修复：

K8s的控制平面(如 kube-apiserver、kube-controller-manager、kube-scheduler)本身也是通过多实例运行，使用etcd存储状态。如果控制平面的某个组件出现故障，其他实例可以自动接管其职责，保证集群的稳定运行。

水平扩展和负载均衡:

K8s持水平扩展应用程序，通过增加Pod的副本数量来处理更多的流量和负载。结合服务发现和负载均衡功能，k8s可以自动将流量分发到健康的Pod上，实现故障转移和自动恢复。