/********************************************************************************
 * Copyright (c) 2021 STMicroelectronics and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 *******************************************************************************/

import { asArray } from './maybe-array';
import { expect } from 'chai';

/* eslint-disable no-unused-expressions */
describe('maybe-array', function (): void {
    it('handles scalar value', function (): void {
        const fromScalar = asArray('hello');
        expect(fromScalar).to.be.an('array').that.has.members(['hello']);
    });

    it('handles array values', function (): void {
        const fromArray = asArray(['hello', 'world']);
        expect(fromArray).to.be.an('array').that.has.ordered.members(['hello', 'world']);

        const fromEmptyArray = asArray([]);
        expect(fromEmptyArray).to.be.an('array').that.is.empty;
    });

    it('handles undefined', function (): void {
        const fromUndefined = asArray(undefined);
        expect(fromUndefined).to.be.an('array').that.has.members([undefined]);
    });
});
