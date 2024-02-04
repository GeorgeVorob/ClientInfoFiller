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
                Trace.TraceInformation("MY: ����� ExcelSelledFileSelectCliek");
                OpenFileDialog dialog = new OpenFileDialog();
                dialog.AllowMultiple = false;
                dialog.Filters.Add(new FileDialogFilter() { Name = "���� excel", Extensions = { "xlsx", "xls" } });


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
                Trace.TraceError("MY: ���������� � MainExcelFileSelectClick!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("������", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: ����� ��������� MainExcelFileSelectClick");
            }
        }

        private async void SellClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: ����� SellClick");
                VM.OnSellClick();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: ���������� � RowSaveClick!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("������", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: ����� ��������� RowSaveClick");
            }
        }
    }
}
