#!/usr/bin/env node

import * as path from "path";
import { Application } from "./src/app";

const app = new Application(
	path.normalize(process.env.CONFIG || `${__dirname}/default.json`)
);

app.start();
