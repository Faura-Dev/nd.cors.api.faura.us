const { appendFileSync, mkdirSync } = require("node:fs");
const os = require("node:os");
const { dirname } = require("node:path");

const SKILL_NAME = "determine-optimality";
const LOG_FILE_ENV_VAR = "DETERMINE_OPTIMALITY_INVOCATION_LOG";

function resolveSkillInvocationLogFilePath() {
	const configuredPath = process.env[LOG_FILE_ENV_VAR];

	if (configuredPath === undefined || configuredPath.trim().length === 0) {
		return undefined;
	}

	return configuredPath;
}

function createSkillInvocationLogEvent() {
	return {
		skill: SKILL_NAME,
		ts: new Date().toISOString(),
		cwd: process.cwd(),
		host: os.hostname(),
		pid: process.pid,
	};
}

function writeSkillInvocationLog(logFilePath, event) {
	const logDir = dirname(logFilePath);

	try {
		mkdirSync(logDir, { recursive: true });
	} catch (error) {
		throw new Error(
			`Failed to create skill invocation log directory: ${logDir}`,
			{
				cause: error,
			},
		);
	}

	try {
		appendFileSync(logFilePath, `${JSON.stringify(event)}\n`, {
			encoding: "utf8",
		});
	} catch (error) {
		throw new Error(
			`Failed to append skill invocation log file: ${logFilePath}`,
			{
				cause: error,
			},
		);
	}
}

function logSkillInvocation() {
	const logFilePath = resolveSkillInvocationLogFilePath();

	if (logFilePath === undefined) {
		return;
	}

	const event = createSkillInvocationLogEvent();
	writeSkillInvocationLog(logFilePath, event);
}

if (require.main === module) {
	logSkillInvocation();
}

module.exports = { logSkillInvocation };
