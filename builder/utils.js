const fs = require('fs');
const ora = require('ora')
const path = require('path')
const axios = require('axios')
const { promisify } = require('util');
const { client_id, client_secret } = require('../config')

function delDir(dir) {
  let files = [];
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir);
    files.forEach((file) => {
      const curPath = `${dir}/${file}`;
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath); // 递归删除文件夹
      } else {
        fs.unlinkSync(curPath); // 删除文件
      }
    });
    fs.rmdirSync(dir);
  }
}

function copyFile(srcPath, tarPath, cb) {
  const rs = fs.createReadStream(srcPath)
  rs.on('error', (err) => {
    if (err) {
      console.log('read error', srcPath)
    }
    cb && cb(err)
  })

  const ws = fs.createWriteStream(tarPath)
  ws.on('error', (err) => {
    if (err) {
      console.log('write error', tarPath)
    }
    cb && cb(err)
  })
  ws.on('close', (ex) => {
    cb && cb(ex)
  })

  rs.pipe(ws)
}

function copyFolder(srcDir, tarDir, cb) {
  fs.readdir(srcDir, (err, files) => {
    let count = 0
    const checkEnd = function () {
      ++count == files.length && cb && cb()
    }

    if (err) {
      checkEnd()
      return
    }

    files.forEach((file) => {
      const srcPath = path.join(srcDir, file)
      const tarPath = path.join(tarDir, file)

      fs.stat(srcPath, (err, stats) => {
        if (stats.isDirectory()) {
          console.log('mkdir', tarPath)
          fs.mkdir(tarPath, (err) => {
            if (err) {
              console.log(err)
              return
            }

            copyFolder(srcPath, tarPath, checkEnd)
          })
        } else {
          copyFile(srcPath, tarPath, checkEnd)
        }
      })
    })

    // 为空时直接回调
    files.length === 0 && cb && cb()
  })
}

function rebuild(dir) {
  // 清空md文件夹
  if (fs.existsSync(dir)) {
    delDir(dir)
  }
  // 重新创建md文件夹
  fs.mkdirSync(dir)
}

function initAxios() {
  axios.default.interceptors.request.use((axiosConfig) => {
    if (client_id) {
      if (!axiosConfig.params) {
        axiosConfig.params = {}
      }
      axiosConfig.params.client_id = client_id
      axiosConfig.params.client_secret = client_secret
    }
    return axiosConfig
  })
}

async function withOra(fn, tip = 'loading...') {
  const spinner = ora(tip).start();

  try {
    const result = await fn()
    spinner.stop()
    return result
  } catch (error) {
    spinner.stop()
    throw error
  }
}

module.exports = {
  withOra,
  delDir,
  rebuild,
  initAxios,
  copyFolder: promisify(copyFolder),
};
