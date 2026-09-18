// Deckfall Endless — native Windows launcher.
// The game files are embedded in this exe at build time (win\build.ps1). On launch they are unpacked to
// %LOCALAPPDATA%\Deckfall Endless\game and opened in a chromeless app window of Microsoft Edge (or Chrome),
// the browser engine that is already on every Windows 10/11 machine. The window uses its own browser profile
// (%LOCALAPPDATA%\Deckfall Endless\profile), so the game's saves persist between sessions and never mix with
// the user's normal browsing, and Edge is told not to sign that profile in or sync it. Nothing to install. Built with the C# compiler that ships with Windows (.NET Framework 4).
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

static class Program
{
    const string AppName = "Deckfall Endless";
    const string ResourcePrefix = "game/";

    [STAThread]
    static int Main(string[] args)
    {
        try
        {
            string baseDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), AppName);
            string profileDir = Path.Combine(baseDir, "profile");
            Directory.CreateDirectory(profileDir);

            // Normally the copy embedded in this exe; pass a path to an index.html to play a working copy instead.
            string index = (args.Length > 0 && File.Exists(args[0])) ? Path.GetFullPath(args[0]) : Unpack(Path.Combine(baseDir, "game"));
            string url = new Uri(index).AbsoluteUri;

            string browser = FindBrowser();
            if (browser == null)
            {
                // No Edge or Chrome: fall back to whatever the default browser is.
                Process.Start(new ProcessStartInfo(index) { UseShellExecute = true });
                return 0;
            }
            string flags = "--app=\"" + url + "\""
                + " --user-data-dir=\"" + profileDir + "\""
                + " --no-first-run --no-default-browser-check --window-size=1120,780"
                + " --disable-sync --disable-features=msImplicitSignin,msSeamlessWebToBrowserSignIn";   // keep this profile signed out
            Process.Start(new ProcessStartInfo(browser, flags) { UseShellExecute = false });
            return 0;
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    // Writes every embedded game file (resource names look like game/js/engine/combat.js) under gameDir, replacing
    // whatever an older build left there, and returns the path of index.html.
    static string Unpack(string gameDir)
    {
        Assembly asm = Assembly.GetExecutingAssembly();
        int count = 0;
        foreach (string name in asm.GetManifestResourceNames())
        {
            if (!name.StartsWith(ResourcePrefix, StringComparison.Ordinal)) continue;
            string rel = name.Substring(ResourcePrefix.Length).Replace('/', Path.DirectorySeparatorChar);
            string dest = Path.Combine(gameDir, rel);
            Directory.CreateDirectory(Path.GetDirectoryName(dest));
            using (Stream src = asm.GetManifestResourceStream(name))
            using (FileStream dst = new FileStream(dest, FileMode.Create, FileAccess.Write))
                src.CopyTo(dst);
            count++;
        }
        if (count == 0) throw new Exception("This build carries no game files. Rebuild it with win\\build.cmd.");
        return Path.Combine(gameDir, "index.html");
    }

    static string FindBrowser()
    {
        string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] candidates = {
            AppPath("msedge.exe"),
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            AppPath("chrome.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(local, @"Google\Chrome\Application\chrome.exe"),
        };
        foreach (string c in candidates)
            if (!string.IsNullOrEmpty(c) && File.Exists(c)) return c;
        return null;
    }

    // Windows' registered location of a browser executable (the "App Paths" key), if any.
    static string AppPath(string exe)
    {
        foreach (RegistryKey root in new[] { Registry.CurrentUser, Registry.LocalMachine })
        {
            try
            {
                using (RegistryKey k = root.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exe))
                {
                    if (k == null) continue;
                    object v = k.GetValue(null);
                    if (v != null) return v.ToString().Trim('"');
                }
            }
            catch { }
        }
        return null;
    }
}
