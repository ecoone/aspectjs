#aspectjs切面编程
aspectjs是一个给JavaScript增加切面功能的强大组件。这个项目起源于eco.js切面功能，但是为了让切面编程更好的发展，所以决定把这部分单独拿出来，你可以单独使用切面功能。，当然你你使用eco.js可以获得同样的功能,两个项目的功能会保持同步更新。

##切面概念

AOP(Aspect Oriented Programming)面向切面编程，是一种编程范式，提供从另一个角度来考虑程序结构以完善面向对象编程（OOP），AOP为开发者提供了一种描述横切关注点的机制，并能够自动将横切关注点织入到面向对象的软件系统中，从而实现了横切关注点的模块化。

**方面/切面（Aspect）**：横切关注点的模块化，比日志组件。可以认为是增强、切入点的组合；在AOP中表示为“在哪里做和做什么集合”；

**连接点（Joinpoint）**：表示需要在程序中插入横切关注点的扩展点，连接点可能是类初始化、方法执行、方法调用、字段调用或处理异常等等，aspectjs只支持方法执行连接点，在AOP中表示为“在哪里做”；

**切入点（Pointcut）**：选择一组相关连接点的模式，即可以认为连接点的集合，在AOP中表示为“在哪里做的集合”；

**增强（Advice）**：或称为增强在连接点上执行的行为，增强提供了在AOP中需要在切入点所选择的连接点处进行扩展现有行为的手段；包括前置增强（before advice）、后置增强 (after advice)、环绕增强 （around advice）等。在AOP中表示为“做什么”；

**目标对象（Target Object）**：需要被织入横切关注点的对象，即该对象是切入点选择的对象，需要被增强的对象，从而也可称为“被增强对象”；在AOP中表示为“对谁做”；


##切面api

###切面
切面定义：`new Aspect(aspectId,advice)`。

**aspectId**:切面的名称，必填。

**advice**:通知，选填。

例子：

	var statTimesFilter = new Aspect("statTimesFilter");

###通知
我们的通知有下面几种类型：before,after,throwing,around,[eventName]。eventName可以是任何事件名.通知可以在切面定义的时候传入，也可以以后定义。

通知定义：`[aspectName].advice.[adviceName] = function(jointPoint)`。
**jointPoint**:这个连接点的数据对象。结构如下：

	{
	  context: context,  //目标对象
	  contextName: Aspect.getClassName(context), //目标对象名字
	  target: originTarget,  //切面针对的函数，在未加切面原来的样子
	  targetName: targetName,//函数名字
	  arguments: arguments,//函数参数
	  result: "",          //函数返回的数据
	  error: "",           //针对异常切面，返回的异常数据
	  stop: false,         //用于阻断函数执行
	  eventDatas: {}	   //key是某个特定事件切面的名称，value是事件传送的数据
	}
	
例子：

	statTimesFilter.advice.before = function(jointPoint){
		var context = jointPoint.context;
		var contextName = jointPoint.contextName;
		var target = jointPoint.target;
		var targetName = jointPoint.targetName;
	    var arguments = jointPoint.arguments;
		this.startTime = new Date();
		this.escape = 0;
		console.log("统计开始时间："+this.startTime);
		//用于控制代码是否停止
		// jointPoint.stop = true;
		jointPoint.arguments[0] ="change";
	}


###连接点

切入点是一组连接点，用于连接目标对象和切面的。

切入点定义：`pointCut(context,targetNames)`。

**context**:目标对象。

**targetNames**:目标对象上要被加上切面的方法名。类型是array或者string

参数可以是1个，也可以是两个。参数为1个的时候，且类型为array或者string，这个参数就是targetNames。如果是object，那么就是context，这个时候的targetNames为这个context上的所有方法。

例子：

	var testObj ={
		f1:function(arg1){
			console.log(arg1)
			console.log("f1");
			if(this._eventAdvices&&this._eventAdvices["f1"]){ //这里是针对事件切面的
				var eventAdvice  = this._eventAdvices["f1"];
				var eventData = {aa:"111"};
				eventAdvice.emit("eventName",eventData);
			}
		}
	}
	statTimesFilter.pointCut(testObj,"f1");
	statTimesFilter.pointCut(testObj,"f1");
	testObj.f1("入参1");