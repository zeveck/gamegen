// Sets a Windows game's .exe icon and name, for package.sh, without Wine:
//   node desktop-icon.mjs <tools/node_modules> <Game.exe> <icon.ico> "<Game name>" <version>
// It reads the icon and version back afterwards and prints what it found.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [modules, exePath, icoPath, name, version = '1.0.0'] = process.argv.slice(2);
if (!modules || !exePath || !icoPath || !name) {
  console.error('usage: desktop-icon.mjs <node_modules> <Game.exe> <icon.ico> "<Game name>" [version]');
  process.exit(1);
}
const ResEdit = await import(pathToFileURL(path.join(modules, 'resedit', 'dist', 'index.js')).href);

const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = ResEdit.NtExecutableResource.from(exe);

// The exe's main icon (group 1), in every size the .ico holds.
const ico = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, ico.icons.map((i) => i.data));

// The name Windows shows for it (Task Manager, file properties).
const [info] = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
const [a, b, c] = `${version}.0.0`.split('.').map((n) => Number(n) || 0);
info.setFileVersion(a, b, c, 0, 1033);
info.setProductVersion(a, b, c, 0, 1033);
info.setStringValues({ lang: 1033, codepage: 1200 }, {
  ProductName: name, FileDescription: name, InternalName: name,
  OriginalFilename: `${name}.exe`, FileVersion: version, ProductVersion: version,
});
info.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));

// Read it back, to be sure the exe is still well formed and has both.
const check = ResEdit.NtExecutableResource.from(ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true }));
const groups = ResEdit.Resource.IconGroupEntry.fromEntries(check.entries);
const [read] = ResEdit.Resource.VersionInfo.fromEntries(check.entries);
const shown = read.getStringValues({ lang: 1033, codepage: 1200 }).ProductName;
if (!groups.length || shown !== name) {
  console.error('windows icon: not set');
  process.exit(1);
}
console.log(`windows icon: set (${groups[0].icons.length} sizes, named ${shown})`);
