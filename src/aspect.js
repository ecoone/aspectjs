/*
 * aspectjs (https://github.com/TUNIU-OPE/aspectjs)
 * Copyright 2015 mni_Ya
 * Licensed under the MIT license
 */
(function(global) {
  var util = {};
  util.isType = function(type) {
    return function(obj) {
      return {}.toString.call(obj) == "[object " + type + "]"
    }
  }
  util.isObject = util.isType("Object");
  util.isString = util.isType("String");
  util.isArray = Array.isArray || util.isType("Array");
  util.isFunction = util.isType("Function");
  util.isUndefined = util.isType("Undefined");
  util.isInArray = function(array, item) {
      for (i = 0; i < array.length; i++) {
        if (array[i] == item)
          return true;
      }
      return false;
  }
  util._uid = 0;
  util.uid = function() {
    return util._uid++
  };
    //对象扩充
  util.extend = function(target, obj, deep, included) {
    var key;
    if (!obj) return target;
    if (util.isArray(deep)) {
      included = deep;
      deep = false;
    }
    if (util.isArray(included) && included.length == 0) included = false;
    for (key in obj) {
      if (util.isArray(included) && !util.isInArray(included, key)) continue;
      if (target === obj[key]) continue;
      if (util.isObject(obj[key]) && deep) {
        if (!target[key]) target[key] = {};
        util.extend(target[key], obj[key], deep);
      }
      target[key] = obj[key];
    }
    return target;
  };

  //摻元事件对象
  var event = {
    events: {},
    contexts: {}
  };

  event.on = function(name, callback, context) {
    var list = this.events[name] || (this.events[name] = [])
    list.push(callback)
    return this
  }

  event.one = function(name, callback) {
    var self = this;
    var oneHandler = function(data) {
      self.off(name, oneHandler);
      callback.call(self, data);
    };
    self.on(name, oneHandler);
    return this
  }

  event.emit = function(name, data) {
    var list = this.events[name]
    if (list) {
      list = list.slice()

      for (var i = 0, len = list.length; i < len; i++) {
        list[i](data)
      }
    }
    return this
  };

  event.off = function(name, callback) {
    if (!(name || callback)) {
      this.events = {}
      return this
    }

    var list = this.events[name]
    if (list) {
      if (callback) {
        for (var i = list.length - 1; i >= 0; i--) {
          if (list[i] === callback) {
            list.splice(i, 1)
          }
        }
      } else {
        delete this.events[name]
      }
    }
    return this
  };

  //切面类
  function Aspect(id, advice) {
    if(arguments.length==1 && util.isObject(id)){
      advice = id;
      id = "_anonymous_aspect_"+util.uid();
    }
    if(arguments.length==0){
      id = "_anonymous_aspect_"+util.uid();
    }
    var aspect = {};
    aspect.id = id;
    aspect.advice = advice ? advice : {};
    aspect.pointCut = Aspect.pointCut;
    aspect._wrapperFunc = Aspect._wrapperFunc;
    return aspect;
  }

  //获取函数名
  Aspect.getMethodName = function(func) {
    return func.name || func.toString().match(/function\s*([^(]*)\(/)[1];
  }

  //获取对象类型名
  Aspect.getClassName = function(obj) {
    return Aspect.getMethodName(obj.constructor);
  }

  //添加切面
  Aspect.pointCut = function(context, targetNames) {
    if (arguments.length == 1) {
      if (!util.isObject(context)) {
        targetNames = context;
        context = global;
      } else {
        targetNames = [];
        for (p in context) {
          if (util.isFunction(context[p])) {
            targetNames.push(p);
          }
        }
      }
    }
    if (util.isString(targetNames)) {
      targetNames = [targetNames];
    }
    for (var i = 0; i < targetNames.length; i++) {
      var targetName = targetNames[i];
      context[targetName] = this._wrapperFunc(context, targetName);
    }
  };

  Aspect._exclused = ["before", "after", "around", "throwing"];
  Aspect._wrapperFunc = function(context, targetName) {
    var originTarget = context[targetName];
    //扩充
    var advice = util.extend({}, this.advice);
    if (!context._eventAdvices) context._eventAdvices = {};
    if (!context._eventAdvices[targetName]) {
      context._eventAdvices[targetName] = util.extend({}, event, true);
    }
    var eventAdvice = context._eventAdvices[targetName];
    return function() {
      //添加事件通知
      for (p in advice) {
        if (util.isFunction(advice[p]) && !util.isInArray(Aspect._exclused, p)) {
          eventAdvice.on(p, function(eventData) {
            advice.joinPoint.eventDatas[p] = eventData;
            advice[p].call(advice, advice.joinPoint);
          });
        }
      }

      try {
        var joinPoint = {
          context: context,
          contextName: Aspect.getClassName(context),
          target: originTarget,
          targetName: targetName,
          arguments: arguments,
          result: "",
          error: "",
          stop: false,
          eventDatas: {}
        };
        advice.joinPoint = joinPoint;
        if (!eventAdvice.joinPoint) eventAdvice.joinPoint = joinPoint;
        if (advice.before) {
          advice.before(joinPoint);
          if (joinPoint.stop) return;
        }
        if (advice.around) {
          advice.around(joinPoint);
          if (joinPoint.stop) return;
        } else {
          joinPoint.result = originTarget.apply(context, arguments);
        }
        if (advice.after) {
          advice.after(joinPoint);
          if (joinPoint.stop) return;
        }
      } catch (error) {
        if (advice.throwing) {
          advice.throwing(joinPoint);
        }
      }
      return joinPoint.result;
    }
  }
  global.Aspect = Aspect;

})(this);