import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/GoogleAnalyticsEventForwarder.js',
        output: {
            file: 'GoogleAnalyticsEventForwarder.js',
            format: 'iife',
            exports: 'named',
            name: 'mpGoogleAnalyticsKit',
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
            file: 'dist/GoogleAnalyticsEventForwarder.iife.js',
            format: 'iife',
            exports: 'named',
            name: 'mpGoogleAnalyticsKit',
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
            file: 'dist/GoogleAnalyticsEventForwarder.common.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpGoogleAnalyticsKit',
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