﻿[CmdletBinding(PositionalBinding = $false)]
Param(
	[Parameter(Mandatory = $false)]
	[switch] $CI = $false,

	[Parameter(Mandatory = $false)]
	[Alias("q")]
	[switch] $Quick = $false,

	[Parameter(Mandatory = $false)]
	[ValidateSet("Debug", "Release")]
	[Alias("m")]
	[System.String] $Mode = "Debug",

	[Parameter(Mandatory = $false)]
	[ValidateSet("quiet", "minimal", "normal", "detailed", "diagnostic")]
	[Alias("v")]
	[System.String] $Verbosity = "quiet",

	[Parameter(Mandatory = $false)]
	[ValidateSet("16.0")]
	[Alias("t")]
	[double] $VSVersion = 16.0,

	[Parameter(Mandatory = $false)]
	[Alias("h")]
	[Switch] $Help = $false
)

function Try-Create-Directory([string[]] $path) {
	if (!(Test-Path -Path $path)) {
		New-Item -Force -ItemType Directory -Path $path | Out-Null
		Write-Log "Creating directory $($path)"
	}
}

function Start-Timer {
	return [System.Diagnostics.Stopwatch]::StartNew()
}

function Get-ElapsedTime([System.Diagnostics.Stopwatch] $timer) {
	$timer.Stop()
	return $timer.Elapsed
}

function Write-Log ([string] $message, $messageColor = "DarkGreen") {
	if ($message) {
		Write-Host $message -BackgroundColor $messageColor
	}
}

function Print-Help {
	if (-not $Help) {
		return
	}

	Write-Host -object ""
	Write-Host -object "********* CodeStream Build Script *********"
	Write-Host -object ""
	Write-Host -object "  Help (-h)                    - [Switch] - Prints this help message."
	Write-Host -object ""
	Write-Host -object "  CI (-ci)                     - [Switch] - For CI only."
	Write-Host -object "  Quick (-q                    - [Switch] - Quick build (avoids agent & webview builds)."
	Write-Host -object "  Mode (-m)                    - [String] - Debug or Release."
	Write-Host -object "  Verbosity (-v)               - [String] - Logging verbosity (quiet, minimal, normal, detailed, or diagnostic)."
	Write-Host -object ""
	Write-Host -object "  VSVersion (-t)               - [String] - Currently only 16.0."
	Write-Host -object ""
	exit 0
}

function Build-AgentAndWebview {
	$timer = Start-Timer

	Write-Log "Bundling agent & webview..."

	& npm run $(if ($CI) { "bundle:ci" } else { "bundle" })
	if ($LastExitCode -ne 0) {
		throw "Bundling webview failed"
	}
	Write-Log "Bundling webview completed"

	Write-Log "Packaging agent..."

	& npm run agent:pkg
	if ($LastExitCode -ne 0) {
		throw "Agent packaging failed"
	}

	if ((Test-Path -Path "../shared/agent/dist/agent.exe") -eq $False) {
		throw "Creating packaged artifacts failed, ensure the agent has been built"
	}

	Copy-Item -Path ..\shared\agent\dist\agent.exe -Destination src\CodeStream.VisualStudio\dist\agent.exe -Force
	if ($LastExitCode -ne 0) {
		throw "Copying packaged artifacts failed"
	}

	Write-Log "Packaging agent completed"

	Write-Log "Build-AgentAndWebview completed in {$(Get-ElapsedTime($timer))}"
}

function Build-Extension {
	$timer = Start-Timer

	$msbuild = ""
	$vstest = ""

	if ($VSVersion -eq 16.0) {
		$msbuild = "C:/Program Files (x86)/Microsoft Visual Studio/2019/Professional/MSBuild/Current/Bin/MSBuild.exe"		
		$vstest = "C:/Program Files (x86)/Microsoft Visual Studio/2019/Professional/Common7/IDE/CommonExtensions/Microsoft/TestWindow/vstest.console.exe"
	}
	else {
		throw "Visual Studio version 16.0 is the only supported version. $($VSVersion) was supplied."
	}

	$OutputDir = $(Join-Path $root "build/artifacts/$($platform)/$($Mode)")
	Try-Create-Directory($OutputDir)

	Write-Log "Cleaning $($OutputDir)..."
	Remove-Item $("$($OutputDir)/*") -Recurse -Force

	Write-Log "Restoring packages..."
	& $msbuild src/CodeStream.VisualStudio.sln -t:Restore

	Write-Log "Running MSBuild..."
	& $msbuild src/CodeStream.VisualStudio.sln /p:AllowUnsafeBlocks=true /verbosity:$Verbosity /target:$target /p:Configuration=$Mode /p:Platform=$platform /p:OutputPath=$OutputDir /p:VisualStudioVersion=$VSVersion /p:DeployExtension=$DeployExtension

	if ($LastExitCode -ne 0) {
		throw "MSBuild failed"
	}

	if (!$Quick) {
		Write-Log "Running UnitTests..."
		if (!(Test-Path -Path $vstest)) {
			throw "UnitTest executable not found $($vstest)"
		}
		& $vstest "$($OutputDir)/CodeStream.VisualStudio.UnitTests.dll" /Platform:$platform

		if ($LastExitCode -ne 0) {
			throw "UnitTests failed"
		}

		Write-Log "UnitTests completed"
	}
	else {
		Write-Log "UnitTests skipped"
	}

	Write-Log "Build-Extension completed in {$(Get-ElapsedTime($timer))}"
	Write-Log "Artifacts: $($OutputDir) at $(Get-Date)"    
}

Print-Help

$target = "Rebuild"
$platform = "x86"

if ($CI) {
	$Quick = $false
	$Mode = "Release"
	$Verbosity = "diagnostic"

	Write-Log "Running in CI mode..."
}

$root = $(Resolve-Path -path "$PSScriptRoot/..")
Push-Location $root

try {
	if (!$Quick) {
		Build-AgentAndWebview
	}
	else {
		Write-Log "Build-AgentAndWebview skipped"
	}
	Build-Extension
}
finally {
	Pop-Location
}
