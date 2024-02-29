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
            Trace.TraceInformation("MY: инициализация VM...");
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
            nameAutocompControl.Items = VM.CustomerNameAutoCompleteData;
            nameAutocompControl.ItemFilter = this.AutocompleteStringFilter;
            nameAutocompControl.SelectionChanged += this.SelectCustomerNameFromAutocomplete;

            var phoneAutocompControl = this.Find<AutoCompleteBox>("PhoneAutocompleteControl");
            phoneAutocompControl.Items = VM.PhoneAutoCompleteData;
            phoneAutocompControl.ItemFilter = this.AutocompleteStringFilter;
            phoneAutocompControl.SelectionChanged += this.SelectPhoneFromAutocomplete;


            Trace.TraceInformation("MY: VM инициализирована");
        }

        private bool ValidateRowAutocomplete(object? sender, SelectionChangedEventArgs e, out string? selectedString)
        {
            selectedString = null;

            if (e.AddedItems.Count <= 0 || e.AddedItems[0] is not string _selectedString) return false;

            selectedString = _selectedString;
            return true;
        }

        private void SelectCustomerNameFromAutocomplete(object? sender, SelectionChangedEventArgs e)
        {
            if (!ValidateRowAutocomplete(sender, e, out string? selectedName)) return;

            VM.CurrentRow.CustomerName = selectedName;
        }    
        
        private void SelectPhoneFromAutocomplete(object? sender, SelectionChangedEventArgs e)
        {
            if (!ValidateRowAutocomplete(sender, e, out string? selectedPhone)) return;

            VM.CurrentRow.Phone = selectedPhone;
        }

        private async void RowSaveClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: старт RowSaveClick");
                VM.OnRowSaveClick();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: исключение в RowSaveClick!");
                Trace.TraceError("MY: текст исключения:" + ex.ToString());
                Trace.TraceError("MY: сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: трассировка:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("ошибка", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: конец работы RowSaveClick");
            }
        }

        private async void FileSelectClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: старт FileSelectClick");
                OpenFileDialog dialog = new OpenFileDialog();
                dialog.AllowMultiple = false;
                dialog.Filters.Add(new FileDialogFilter() { Name = "файл excel", Extensions = { "xlsx", "xls" } });

                string[] result = await dialog.ShowAsync(this);

                if (result != null)
                {
                    VM.CurrentFilePath = result[0];
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: исключение в FileSelectClick!");
                Trace.TraceError("MY: текст исключения:" + ex.ToString());
                Trace.TraceError("MY: сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: трассировка:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("ошибка", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: конец работы FileSelectClick");
            }
        }

        private async void SearchClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: старт SearchClick");
                VM.OnSearchClick();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: исключение в SearchClick!");
                Trace.TraceError("MY: текст исключения:" + ex.ToString());
                Trace.TraceError("MY: сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: трассировка:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("ошибка", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: конец работы SearchClick");
            }
        }

        private async void RowResetClick(object sender, RoutedEventArgs e)
        {
            try
            {
                Trace.TraceInformation("MY: старт RowResetClick");
                VM.ResetCurrentRow();
            }
            catch (Exception ex)
            {
                Trace.TraceError("MY: исключение в RowResetClick!");
                Trace.TraceError("MY: текст исключения:" + ex.ToString());
                Trace.TraceError("MY: сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: трассировка:" + ex.StackTrace);

                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("ошибка", ex.Message + "\n \n \n" + ex.StackTrace);
                await messageBoxStandardWindow.Show();
            }
            finally
            {
                Trace.TraceInformation("MY: конец работы RowResetClick");
            }
        }

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
                Trace.TraceError("MY: исключение в OnNumericTextInput!");
                Trace.TraceError("MY: текст исключения:" + ex.ToString());
                Trace.TraceError("MY: сообщение исключения:" + ex.Message);
                Trace.TraceError("MY: трассировка:" + ex.StackTrace);
            }
        }

        /// <summary>
        /// Сравнивает имена в строках таблицы с вводимым именем, служебный метод для AutoCompleteBox
        /// </summary>
        /// <param name="search">Уже введенная строка</param>
        /// <param name="value">Объект, который может или не может попасть в выдачу автокомплита.</param>
        /// <returns></returns>
        bool AutocompleteStringFilter(string search, object value)
        {
            string stringToCompare = value as string;
            if (stringToCompare == null) return false;

            return (
                !string.IsNullOrEmpty(stringToCompare)
                && stringToCompare.ToLower().Contains(search.ToLower())
            );
        }
    }
}