import babel from "rollup-plugin-babel"; // 转换babel
// import {uglify} from 'rollup-plugin-uglify';
import serve from "rollup-plugin-serve";

export default {
    input:"./src/index.js",// 以哪个文件作为入口
    output:{
        file:"dist/umd/promise.js", // 打包出的文件放在哪里
        format:"umd",// 打包后的结果是umd模块规范
        name:"JJPromise",// 打包后的全局变量
        sourcemap:true,// es6 -> es5 开启源码调试
    },
    plugins:[
        babel({
            exclude:"./node_modules/**", // 忽略文件 glob的写法,
        }),
        // uglify(),
        process.env.ENV === "development"?
        serve({
            open:true,
            openPage:"/public/index.html", // 默认打开的页面路径
            port:3000,
            contentBase:""
        }):null
    ],
}