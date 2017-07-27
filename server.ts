#!/usr/bin/env node

import * as path from "path";
import { Application } from "./src/app";

const app = new Application(
	path.normalize("/Users/ido/src/re-to-do-list/config/local.json")
);

app.start();
