Set-StrictMode -Version Latest

New-Module -ScriptBlock {
    function Get-PropsPath {
        Join-Path $rootDirectory src\Directory.Build.props
    }

    function Get-PropsXml {
        $xmlLines = Get-Content (Get-PropsPath)
        # If we don't explicitly join the lines with CRLF, comments in the XML will
        # end up with LF line-endings, which will make Git spew a warning when we
        # try to commit the version bump.
        $xmlText = $xmlLines -join [System.Environment]::NewLine

        [xml] $xmlText
    }

    function Read-CurrentVersionProps {
        [System.Version] (Get-PropsXml).Project.PropertyGroup.AssemblyVersion
    }

    function Write-VersionProps([System.Version]$version) {

        $document = Get-PropsXml

        $numberOfReplacements = 0
        $document.Project.PropertyGroup.AssemblyVersion = "$($version.Major).$($version.Minor).$(($version.Build, 0 -ne $null)[0]).$(($version.Revision, 0 -ne $null)[0])"
        $document.Project.PropertyGroup.FileVersion = "$($version.Major).$($version.Minor).$(($version.Build, 0 -ne $null)[0]).$(($version.Revision, 0 -ne $null)[0])"

        $document.Save((Get-PropsPath))
    }

    Export-ModuleMember -Function Get-PropsPath,Read-CurrentVersionProps,Write-VersionProps
}