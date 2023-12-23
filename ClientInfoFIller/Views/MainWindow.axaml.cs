using Avalonia;
using Avalonia.Controls;
using Avalonia.Data;
using Avalonia.Input;
using Avalonia.Interactivity;
using ClientInfoFiller.Models;
using ClientInfoFiller.ViewModels;
using System;
using System.Diagnostics;
using System.Linq;
using System.Numerics;

namespace ClientInfoFiller.Views
{
    public partial class MainWindow : Window
    {
        MainWindowViewModel VM = new MainWindowViewModel();
        public MainWindow()
        {
            Trace.TraceInformation("MY: ������������� VM...");
            InitializeComponent();
            this.DataContext = VM;
            // var VM = this.DataContext as MainWindowViewModel;
            if (VM == null) throw new Exception("VM not found");

            this.Find<TextBox>("PriceInput").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);

            this.Find<TextBox>("PrepaymentInputCash").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);
            this.Find<TextBox>("PrepaymentInputDigital").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);

            this.Find<TextBox>("PledgeInputCash").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);
            this.Find<TextBox>("PledgeInputDigital").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);
            // searchComboBox.Items = VM.searchModesComboBoxData;
            // searchComboBox.SelectedIndex = 0;

            var nameAutocompControl = this.Find<AutoCompleteBox>("NameAutocompleteControl");
            nameAutocompControl.Items = VM.AutoCompleteData;
            nameAutocompControl.ItemFilter = this.NameAutocomplete;
            nameAutocompControl.SelectionChanged += this.SelectFromAutocomplete;

            var phoneAutocompControl = this.Find<AutoCompleteBox>("PhoneAutocompleteControl");
            phoneAutocompControl.Items = VM.AutoCompleteData;
            phoneAutocompControl.ItemFilter = this.PhoneAutocomplete;
            phoneAutocompControl.SelectionChanged += this.SelectFromAutocomplete;


            Trace.TraceInformation("MY: VM ����������������");
        }

        private void SelectFromAutocomplete(object? sender, SelectionChangedEventArgs e)
        {
            if (e.AddedItems.Count <= 0 || e.AddedItems[0] is not Row selectedRow) return;

            if(e.RemovedItems.Count > 0 && e.RemovedItems[0] is Row deletedRow
                    &&(
                        deletedRow.Id != -1
                        || deletedRow.RowPos != -1
                    )
                )
            {
                return;
            }

            VM.CurrentRow = selectedRow;
        }

        private async void RowSaveOrUpdateClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: ����� RowSaveClick");
                VM.OnRowSaveClick();
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

        private async void RowUpdateAndPrintClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: ����� RowUpdateAndPrintClick");
                VM.OnRowSaveClick(true);
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

        private async void FileSelectClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: ����� FileSelectClick");
                OpenFileDialog dialog = new OpenFileDialog();
                dialog.AllowMultiple = false;
                dialog.Filters.Add(new FileDialogFilter() { Name = "����� excel", Extensions = { "xlsx", "xls" } });

                string[] result = await dialog.ShowAsync(this);

                if (result != null)
                {
                    VM.MainExcelFilePath = result[0];
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: ���������� � FileSelectClick!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("������", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: ����� ��������� FileSelectClick");
            }
        }

        private async void SearchClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: ����� SearchClick");
                VM.OnSearchClick();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: ���������� � SearchClick!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("������", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: ����� ��������� SearchClick");
            }
        }

        private async void RowResetClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: ����� RowResetClick");
                VM.ResetCurrentRow();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: ���������� � RowResetClick!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("������", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: ����� ��������� RowResetClick");
            }
        }

        // ���������� ���������� ����� ��� ��������� �����.
        private void OnNumericTextInput(TextBox sender, RoutedEventArgs args)
        {
            try
            {
                TextInputEventArgs Args = args as TextInputEventArgs;

                Args.Handled =
                    Args.Text.Any(c => !char.IsDigit(c))
                    ||
                    (sender.Text.Length > 8);
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: ���������� � OnNumericTextInput!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);
            }
        }

        /// <summary>
        /// ���������� ����� � ������� ������� � �������� ������, ��������� ����� ��� AutoCompleteBox
        /// </summary>
        /// <param name="search">��� ��������� ������</param>
        /// <param name="value">������, ������� ����� ��� �� ����� ������� � ������ ������������.</param>
        /// <returns></returns>
        bool NameAutocomplete(string search, object value)
        {
            Row row = value as Row;
            if (row == null) return false;

            return (
                !string.IsNullOrEmpty(row.CustomerName)
                && row.CustomerName.ToLower().Contains(search.ToLower())
            );
        }

        /// <summary>
        /// ���������� �������� � ������� ������� � �������� �������, ��������� ����� ��� AutoCompleteBox
        /// </summary>
        /// <param name="search">��� ��������� ������</param>
        /// <param name="value">������, ������� ����� ��� �� ����� ������� � ������ ������������.</param>
        /// <returns></returns>
        bool PhoneAutocomplete(string search, object value)
        {
            Row row = value as Row;
            if (row == null) return false;

            return (
                !string.IsNullOrEmpty(row.Phone)
                && row.Phone.ToLower().StartsWith(search.ToLower())
            );
        }
    }
}