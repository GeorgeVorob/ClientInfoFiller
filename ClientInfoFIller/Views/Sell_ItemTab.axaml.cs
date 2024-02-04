using Avalonia.Controls;
using System.Diagnostics;
using System;
using Avalonia.Interactivity;
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using ClientInfoFiller.ViewModels;

namespace ClientInfoFiller.Views
{
    public partial class Sell_ItemTab : UserControl
    {
        public Sell_ItemTab()
        {
            InitializeComponent();
        }

        Sell_ItemTabViewModel VM = new Sell_ItemTabViewModel();

        private async void ExcelSelledFileSelectCliek(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: старт ExcelSelledFileSelectCliek");
                OpenFileDialog dialog = new OpenFileDialog();
                dialog.AllowMultiple = false;
                dialog.Filters.Add(new FileDialogFilter() { Name = "Файл excel", Extensions = { "xlsx", "xls" } });


                string[]? result = null;

                if (Avalonia.Application.Current.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
                {
                    result = await dialog.ShowAsync(desktop.MainWindow);
                }


                if (result != null)
                {
                    VM.ExcelSelledFilepath = result[0];
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: Исключение в MainExcelFileSelectClick!");
                Trace.TraceError("MY: Текст исключения:" + ex.ToString());
                Trace.TraceError("MY: Сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: Трассировка:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("Ошибка", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: конец обработки MainExcelFileSelectClick");
            }
        }

        private async void SellClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: старт SellClick");
                VM.OnSellClick();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: Исключение в RowSaveClick!");
                Trace.TraceError("MY: Текст исключения:" + ex.ToString());
                Trace.TraceError("MY: Сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: Трассировка:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("Ошибка", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: конец обработки RowSaveClick");
            }
        }
    }
}
