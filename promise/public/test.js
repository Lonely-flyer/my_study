// const promise = new Promise((resolve, reject) => {
// 	resolve("jj好帅");
// });
// console.log(
// 	promise
// 		.then((res) => {
// 			console.log(res);
// 			return { name: "张三" };
// 		})
// 		.then((res) => {
// 			console.log("res: ", res);
// 		})
// );

const test = new MyPromise((resolve, reject) => {
	// setTimeout(() => {
	//
	// }, 2000);
	resolve("success");
	// reject("err");
});

test

	.then()
	.then()
	.then(
		(value) => console.log(value),
		(reason) => console.log(reason)
	);

console.log("test: ", test);

MyPromise.resolve()
	.then(() => {
		console.log(0);
		return MyPromise.resolve(4);
	})
	.then((res) => {
		console.log(res);
	});


    // 引入promises-aplus-tests 以 872项 promise a+ 规范 检测自己的代码