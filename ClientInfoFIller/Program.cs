using Avalonia;
using Avalonia.Logging;
using Avalonia.ReactiveUI;
using Microsoft.VisualBasic.Logging;
using OfficeOpenXml;
using System;
using System.Diagnostics;
using System.IO;

namespace ClientInfoFiller
{
    internal class Program
    {
        private const string TraceEnableConfigFilename = @"EnableTrace.txt";
        // Initialization code. Don't use any Avalonia, third-party APIs or any
        // SynchronizationContext-reliant code before AppMain is called: things aren't initialized
        // yet and stuff might break.
        [STAThread]
        public static void Main(string[] args)
        {
            if (CheckIfWeMustEnableLogs())
            {
                var logWriter = new FileLogTraceListener();
                logWriter.AutoFlush = true;
                logWriter.Location = LogFileLocation.ExecutableDirectory;
                logWriter.TraceOutputOptions = TraceOptions.DateTime;


                Trace.Listeners.Add(logWriter);
                Trace.AutoFlush = true;
            }
            Trace.TraceInformation("MY: Запуск приложения, логгер инициализирован");

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            try
            {
                Trace.TraceInformation("MY: Запуск avaloinia...");
                BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: Исключение в основном потоке!");
                Trace.TraceError("MY: Текст исключения:" + ex.ToString());
                Trace.TraceError("MY: Сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: Трассировка:" + ex.StackTrace);
            }
            Trace.TraceInformation("MY: завершение работы");
        }


        private static bool CheckIfWeMustEnableLogs()
        {
            if(!File.Exists(TraceEnableConfigFilename))
            {
                File.WriteAllText(TraceEnableConfigFilename, "true"); // default value
            }

            return bool.Parse(File.ReadAllText(TraceEnableConfigFilename));
        }


        // Avalonia configuration, don't remove; also used by visual designer.
        public static AppBuilder BuildAvaloniaApp()
            => AppBuilder.Configure<App>()
                .UsePlatformDetect()
                .LogToTrace(
                    LogEventLevel.Information,
                    LogArea.Property,
                    LogArea.Binding,
                    LogArea.Animations,
                    LogArea.Visual,
                    LogArea.Layout,
                    LogArea.Control
                )
                .UseReactiveUI();
    }
}