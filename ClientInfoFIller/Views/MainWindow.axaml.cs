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

            var myBinding = new Binding
            {
                Source = VM.CurrentRow.CustomerName,
                Mode = BindingMode.TwoWay,
            };

            //nameAutocompControl.Bind(AutoCompleteBox.TextProperty, VM.CurrentRow.CustomerName);
            Trace.TraceInformation("MY: VM ����������������");
        }

        private async void RowSaveClick(object sender, RoutedEventArgs e)
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
                    .GetMessageBoxStandardWindow("������", ex.Message + "- \n" + ex.StackTrace);
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
                    VM.CurrentFilePath = result[0];
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: ���������� � FileSelectClick!");
                Trace.TraceError("MY: ����� ����������:" + ex.ToString());
                Trace.TraceError("MY: ��������� ����������:" + ex.Message);
                Trace.TraceError("MY: �����������:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("������", ex.Message + "- \n" + ex.StackTrace);
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
                    .GetMessageBoxStandardWindow("������", ex.Message + "- \n" + ex.StackTrace);
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
                    .GetMessageBoxStandardWindow("������", ex.Message + "- \n" + ex.StackTrace);
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

        bool NameAutocomplete(string search, object value)
        {
            Row row = value as Row;
            return row?.CustomerName.ToLower().StartsWith(search.ToLower()) ?? false;
        }
    }
}