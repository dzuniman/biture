const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
    user: "ditaudynastyco",
    password: "DitauEntle01",
    host: "ftp.erp.ditaudynasty.co.za",
    port: 21,
    localRoot: __dirname,
    remoteRoot: "/public_html/api_erp_ditaudynasty",
    include: [
        "*", "**/*",
        ".env.ditau-production",
        ".htaccess"
    ],
    deleteRemote: false,
    overwrite: true,
    forcePasv: true,
    dotFiles: true
};

ftpDeploy.deploy(config)
    .then(res => {
        console.log("DITAU Production backend deploy finished:", res);
    })
    .catch(err => console.error(err));
