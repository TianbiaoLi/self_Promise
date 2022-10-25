(function (window) {
	const PENDING = "pending";
	const RESOLVED = "resolved";
	const REJECTED = "rejected";

	class Promise {
		// 构造函数
		// excutor：执行器函数（同步）
		constructor(excutor) {
			const self = this;
			self.status = PENDING; // promise对象的状态属性
			self.data = undefined; // promise对象用于存储结果的属性
			self.callbacks = []; // 每个元素的结构：{ onResolved(){},onRejected(){}}

			function resolve(value) {
				// 判断是否多次执行
				if (self.status !== PENDING) return;
				// 改变状态
				self.status = RESOLVED;
				// 改变值
				self.data = value;
				// 如果有待执行的callback函数（提前定义了then），立即异步执行所有回调中的onResolved
				setTimeout(() => {
					if (self.callbacks.length > 0) {
						self.callbacks.forEach(callbacksObj => {
							callbacksObj.onResolved(value);
						});
					}
				});
			}

			function reject(reason) {
				// 判断是否多次执行
				if (self.status !== PENDING) return;
				// 改变状态
				self.status = REJECTED;
				// 改变值
				self.data = reason;
				// 如果有待执行的callback函数（提前定义了then），立即异步执行所有回调中的onRejected
				setTimeout(() => {
					if (self.callbacks.length > 0) {
						self.callbacks.forEach(callbacksObj => {
							callbacksObj.onRejected(reason);
						});
					}
				});
			}

			// 立即同步执行excutor
			try {
				excutor(resolve, reject);
			} catch (error) {
				// 执行器抛出异常，promise变为rejected状态
				reject(error);
			}
		}

		// 原型对象方法then()
		// 指定成功与失败的回调
		// 返回新的promise对象
		then(onResolved, onRejected) {
			onResolved =
				typeof onResolved === "function" ? onResolved : value => value;
			// 异常穿透
			onRejected =
				typeof onRejected === "function"
					? onRejected
					: reason => {
							throw reason;
					  };

			const self = this;
			// 调用指定的回调函数，根据执行结果，改变return的promise的状态

			// 返回新的promise对象
			return new Promise((resolve, reject) => {
				function handle(callback) {
					// 1.抛出异常，return的promise为失败，reason即为error
					// 2.回调函数返回不是promise，return的promise为成功，value为返回值
					// 3.回调函数为promise，return的promise的结果为该promise结果
					try {
						const result = callback(self.data);
						if (result instanceof Promise) {
							// 3.回调函数为promise，return的promise的结果为该promise结果
							// result.then(
							//     value=> resolve(value), // result成功，调用此处，将promise改为成功
							//     reason=> reject(reason) // result失败，调用此处，将promise改为失败
							// )
							// 简化
							result.then(resolve, reject);
						} else {
							// 2.回调函数返回不是promise，return的promise为成功，value为返回值
							resolve(result);
						}
					} catch (error) {
						// 1.抛出异常，return的promise为失败，reason即为error
						reject(error);
					}
				}
				if (self.status === PENDING) {
					// 若当前为pending状态，则保存回调函数，需要保证该函数被调用时有完整的异步功能
					self.callbacks.push({
						onResolved() {
							handle(onResolved);
						},
						onRejected() {
							handle(onRejected);
						},
					});
				} else if (self.status === RESOLVED) {
					// 若当前为resolved状态，则根据传入的回调的执行结果返回新的promise
					setTimeout(() => {
						handle(onResolved);
					});
				} else {
					// 若当前为rejected状态，则根据传入的回调的执行结果返回新的promise
					setTimeout(() => {
						handle(onRejected);
					});
				}
			});
		}

		// 原型对象方法catch()
		// 指定失败的回调
		// 返回新的promise对象
		catch(onRejected) {
			return this.then(undefined, onRejected);
		}

		// Promise函数对象的方法resolve()
		// 返回一个指定结果的成功的promise
		static resolve = function (value) {
			return new Promise((resolve, reject) => {
				if (value instanceof Promise) {
					value.then(resolve, reject);
				} else {
					resolve(value);
				}
			});
		};

		// Promise函数对象的方法reject()
		// 返回一个指定reason的失败的promise
		static reject = function (reason) {
			return new Promise((resolve, reject) => {
				reject(reason);
			});
		};

		// Promise函数对象的方法all()
		// 返回一个promise，只有promises都成功才成功，否则失败
		static all = function (promises) {
			const values = new Array(promises.length);
			let resolvedCount = 0;
			return new Promise((resolve, reject) => {
				promises.forEach((p, index) => {
					Promise.resolve(p).then(
						value => {
							resolvedCount++;
							values[index] = value;

							if (resolvedCount === promises.length) {
								resolve(values);
							}
						},
						reason => {
							reject(reason);
						}
					);
				});
			});
		};

		// Promise函数对象的方法race()
		// 返回一个promise，由第一个完成的promise决定
		static race = function (promises) {
			return new Promise((resolve, reject) => {
				promises.forEach(p => {
					Promise.resolve(p).then(
						value => {
							resolve(value);
						},
						reason => {
							reject(reason);
						}
					);
				});
			});
		};

		// 自定义
		// 返回一个promise对象，在指定时间之后才确定结果
		static resolveDelay = function (value, time) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (value instanceof Promise) {
						value.then(resolve, reject);
					} else {
						resolve(value);
					}
				}, time);
			});
		};

		// 自定义
		// 返回一个promise对象，在指定时间之后才确定结果
		static rejectDelay = function (reason, time) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					reject(reason);
				}, time);
			});
		};
	}

	window.Promise = Promise;
})(window);
