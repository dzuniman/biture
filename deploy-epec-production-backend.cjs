const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
    user: "biturvnu",
    password: "2X66ei72gGwzE",
    host: "ftp.erp.biture.co.za",
    port: 21,
    localRoot: __dirname + "/api",
    remoteRoot: "/public_html/api_erp_epec",
    include: [
        "*", "**/*",
        ".env.epec-production",
        ".htaccess"
    ],
    deleteRemote: false,
    overwrite: true,
    forcePasv: true,
    dotFiles: true
};

ftpDeploy.deploy(config)
    .then(res => {
        console.log("EPEC Production backend deploy finished:", res);
    })
    .catch(err => console.error(err));
