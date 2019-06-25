import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/GoogleAnalyticsEventForwarder.js',
    output: {
        file: 'GoogleAnalyticsEventForwarder.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-googleAnalytics-kit',
        strict: false
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
},
{
    input: 'src/GoogleAnalyticsEventForwarder.js',
    output: {
        file: 'dist/GoogleAnalyticsEventForwarder.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-googleAnalytics-kit',
        strict: false
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
}
] 