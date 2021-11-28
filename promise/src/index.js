const isObject = (obj) => Object.prototype.toString.call(obj) === "[object Object]";
const isFunction = (obj) => Object.prototype.toString.call(obj) === "[object Function]";

/**
 * promise 决议
 * MyPromise 的处理流程函数
 * then 方法里面 return 一个返回值作为下一个 then 方法的参数
 * 如果是 return 一个 MyPromise 对象，那么就需要判断它的状态
 * 如果 then 方法返回的是自己的 MyPromise 对象，则会发生循环调用，这个时候程序会报错
 * */
const resolvePromise = (promise2, x, resolve, reject) => {
	if (x === promise2) {
		return reject(new TypeError("Chaining cycle detected for promise #<Promise>")); // 循环引用
	}
	// if (x === null) {
	// 	resolve(x);
	// } else if (x instanceof JJPromise) {
	// 	if (x.status === PENDING) {
	// 		x.then.call(
	// 			(r) => resolvePromise(promise2, r, resolve, reject),
	// 			(e) => reject(e)
	// 		);
	// 	} else {
	// 		x.then(resolve, reject);
	// 	}
	// } else
	if (isObject(x) || isFunction(x)) {
		let lock = false; // 加锁
		try {
			let then = x.then;
			if (typeof then === "function") {
				then.call(
					x,
					(r) => {
						if (lock) return;
						lock = true;
						resolvePromise(promise2, r, resolve, reject);
					},
					(e) => {
						if (lock) return;
						lock = true;
						reject(e);
					}
				);
			} else {
				if (lock) return;
				lock = true;
				resolve(x);
			}
		} catch (error) {
			if (lock) return;
			lock = true;
			reject(error);
		}
	} else {
		resolve(x);
	}

	// if (x === promise2) {
	// 	return reject(new TypeError("Chaining cycle detected for promise #<Promise>")); // 循环引用
	// }
	// if (typeof x !== null && (typeof x === "object" || typeof x === "function")) {
	// 	let called = false;
	// 	try {
	// 		const then = x.then;
	// 		if (typeof then === "function") {
	// 			then.call(
	// 				x,
	// 				(r) => {
	// 					if (called) return;
	// 					called = true;
	// 					resolvePromise(promise2, r, resolve, reject);
	// 				},
	// 				(e) => {
	// 					if (called) return;
	// 					called = true;
	// 					reject(e);
	// 				}
	// 			);
	// 		} else {
	// 			if (called) return;
	// 			called = true;
	// 			resolve(x);
	// 		}
	// 	} catch (error) {
	// 		if (called) return;
	// 		called = true;
	// 		reject(error);
	// 	}
	// } else {
	// 	resolve(x);
	// }
};
// 定义三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
	// 初始化状态
	status = PENDING;
	//初始化结果
	result = undefined;
	reason = undefined;
	onResolvedCallbacks = [];
	onRejectedCallbacks = [];
	constructor(executor) {
		if (typeof executor !== "function") throw new TypeError(`Promise resolver " + <${typeof executor}> + " is not a function`);

		const resolve = (result) => {
			if (this.status === PENDING) {
				this.status = FULFILLED;
				this.result = result;
				this.onResolvedCallbacks.forEach((fn) => fn(this.result));
			}
		};

		const reject = (reason) => {
			if (this.status === PENDING) {
				this.status = REJECTED;
				this.reason = reason;
				this.onRejectedCallbacks.forEach((fn) => fn(this.reason));
			}
		};

		try {
			executor(resolve, reject);
		} catch (err) {
			reject(err);
		}
	}
	/**
	 * then方法实现逻辑
	 * 1、then方法中的参数是可选的
	 * 2、当状态为 FULFILLED 时执行 onFulfillment，状态为 REJECTED 时执行 onRejected, 返回一个新的 MyPromise 供链式调用
	 */
	then(onFulfilled, onRejected) {
        // 如果onfulfilled/onrejected不是函数：为了保证穿透顺延效果，需要为其设置默认函数，就是如果在后续调用then时可能没有给传onfulfilled/onrejected函数，那么我们需要设置一个默认的函数，保证顺延。
		onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (result) => result;
		onRejected =
			typeof onRejected === "function"
				? onRejected
				: (reason) => {
						throw reason;
				  };
		const self = this;
		// 在promise/A+规范中，这里要求确保 onFulfilled 和 onRejected 在事件循环调用之后异步执行，并且有一个新的堆栈。
		// 这可以用宏任务机制(如setTimeout或setImmediate)来实现，也可以用微任务机制(如MutationObserver或process.nextTick)来实现。
		// 这里我使用了queueMicrotask 来确保 onFulfilled 和 onRejected 在事件循环调用之后异步执行
		const promise2 = new MyPromise((resolve, reject) => {
			if (self.status === FULFILLED) {
				setTimeout(() => {
					//如果onFulfilled或onRejected抛出一个异常e,promise2 必须被拒绝（rejected）并把e当作原因
					try {
						const r = onFulfilled(self.result);
						resolvePromise(promise2, r, resolve, reject);
					} catch (err) {
						reject(err);
					}
				});
			} else if (self.status === REJECTED) {
				setTimeout(() => {
					try {
						const e = onRejected(self.reason);
						resolvePromise(promise2, e, resolve, reject);
					} catch (err) {
						reject(err);
					}
				});
			} else if (self.status === PENDING) {
				//把它存储到数组中，但是以后还要监听方法的执行结果，从而做其它事情
				self.onResolvedCallbacks.push(() => {
					setTimeout(() => {
						try {
							const r = onFulfilled(self.result);
							resolvePromise(promise2, r, resolve, reject);
						} catch (err) {
							reject(err);
						}
					});
				});
				self.onRejectedCallbacks.push(() => {
					setTimeout(() => {
						try {
							const e = onRejected(self.reason);
							resolvePromise(promise2, e, resolve, reject);
						} catch (err) {
							reject(err);
						}
					});
				});
			}
		});
		return promise2;
	}
	catch(onRejected) {
		return this.then(null, onRejected);
	}
	finally(callback) {
		return this.then(
			(result) => {
				return MyPromise.resolve(callback()).then(() => result);
			},
			(reason) => {
				return MyPromise.resolve(callback()).then(() => {
					throw reason;
				});
			}
		);
	}

	static resolve(result) {
		if (result instanceof MyPromise) {
			return result;
		}
		return new MyPromise((resolve, reject) => {
			resolve(result);
		});
	}

	static reject(reason) {
		return new MyPromise((resolve, reject) => {
			reject(reason);
		});
	}
}
// 检测是否符合 promise A+ 规范
MyPromise.defer = MyPromise.deferred = function () {
	let result = {};
	result.promise = new MyPromise(function (resolve, reject) {
		result.resolve = resolve;
		result.reject = reject;
	});
	return result;
};

module.exports = MyPromise;
