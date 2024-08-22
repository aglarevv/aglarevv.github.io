修改使用的shell解释器：
```
vi /etc/passwd
```
全局变量（环境变量）生效优先级：
> 优先级依次递增
1. /etc/profile
2. /etc/profile.d
3. $HOME/.bash_profile
4. $HOME/.bashrc
5. /etc/bashrc
