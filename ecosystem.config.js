module.exports = {
    apps: [
        {
            name: "dooball-live",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3008", // หากต้องการรันโหมด Dev ให้เปลี่ยน 'start' เป็น 'dev'
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};