#!/bin/bash
#################################################################################
# Copyright (c) 2021 STMicroelectronics and others.
#
# This program and the accompanying materials are made available under the
# terms of the Eclipse Public License 2.0 which is available at
# http://www.eclipse.org/legal/epl-2.0.
#
# This Source Code may also be made available under the following Secondary
# Licenses when the conditions for such availability set forth in the Eclipse
# Public License v. 2.0 are satisfied: GNU General Public License, version 2
# with the GNU Classpath Exception which is available at
# https://www.gnu.org/software/classpath/license.html.
#
# SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
#################################################################################

# Make sure that you have a 'gcc' compiler and 'cmake' on the PATH.

configs=(
  "Debug_x86-64::-march=x86-64 -O0 -g -ffunction-sections -fdata-sections -DDEBUG_ENABLED -fstack-usage"
  "Release_Atom::-march=atom -mfpmath=sse -mhard-float -Os -g0 -ffunction-sections -fdata-sections -DRELEASE_ENABLED"
)

function build {
  local config=$1
  local build_dir=$2
  local config_argline=$3
  rm -rf $build_dir
  mkdir $build_dir

  (
    cd $build_dir
    cmake .. -G "Unix Makefiles" -DEXT_FLAGS="${config_argline}" -DLIBNAME=$config
    make -j8
  )
}

for config_entry in "${configs[@]}"; do
  config="${config_entry%%::*}"
  config_argline="${config_entry##*::}"
  echo "Building $config"

  build "$config" "lib/$config" "$config_argline"
  build "$config" "app/$config" "$config_argline"
done
