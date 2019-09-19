/********************************************************************************
 * Copyright (c) 2018 TypeFox and others
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

 /* copied code from https://github.com/TypeFox/theia-xtext-sprotty-example/blob/master/theia/theia-version.js#L1-26 */

const shell = require('shelljs')
const fs = require('fs');

const version  = process.argv[2];

function setTheiaVersion(pkgJsonFile, version) {
	if (!/(^|\/)node_modules\//.test(pkgJsonFile)) {
		shell.echo(`Setting @theia version to ${version} in ${pkgJsonFile}`)
		const content = fs.readFileSync(pkgJsonFile).toString()
		const newContent = content
			.replace(/("@theia\/[^"]*":)\s*"(latest|next)"/g, `$1 "${version}"`)
		fs.writeFileSync(pkgJsonFile, newContent)
	}
}

if (!version || ['next', 'latest'].indexOf(version.trim()) < 0) {
	shell.echo(`Sets the version of the @theia extension dependencies in the package.json files.`)
	shell.echo()
	shell.echo('Usage:')
	shell.echo("node script/theia-version.js '<next|latest>'")
} else {
	shell.ls('-R')
		.filter(f => f.endsWith('package.json'))
		.forEach(f => setTheiaVersion(f, version.trim()))
}
