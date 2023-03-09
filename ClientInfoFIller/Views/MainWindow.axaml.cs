using Avalonia.Controls;
using Avalonia.Data.Converters;
using Avalonia.Input;
using Avalonia.Interactivity;
using ClientInfoFIllerFinal.ViewModels;
using System;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace ClientInfoFIllerFinal.Views
{
    public partial class MainWindow : Window
    {
        MainWindowViewModel VM => this.DataContext as MainWindowViewModel;
        public MainWindow()
        {
            InitializeComponent();

            // VM = this.DataContext as MainWindowViewModel;
            // if (VM == null) throw new Exception("VM not found");

            this.Find<TextBox>("PriceInput").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);

            this.Find<TextBox>("PrepaymentInputCash").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);
            this.Find<TextBox>("PrepaymentInputDigital").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);

            this.Find<TextBox>("PledgeInputCash").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);
            this.Find<TextBox>("PledgeInputDigital").AddHandler(TextBox.TextInputEvent, OnNumericTextInput, RoutingStrategies.Tunnel);
            // searchComboBox.Items = VM.searchModesComboBoxData;
            // searchComboBox.SelectedIndex = 0;
        }

        private async void RowSaveClick(object sender, RoutedEventArgs e)
        {
            try
            {
                VM.OnRowSaveClick();
            }
            catch (Exception ex)
            {
                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("Ошибка", ex.Message);
                await messageBoxStandardWindow.Show();
            }
        }

        private async void FileSelectClick(object sender, RoutedEventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog();
            dialog.AllowMultiple = false;
            dialog.Filters.Add(new FileDialogFilter() { Name = "Файлы excel", Extensions = { "xlsx", "xls" } });

            string[] result = await dialog.ShowAsync(this);

            if (result != null)
            {
                VM.CurrentFilePath = result[0];
            }
        }

        private async void SearchClick(object sender, RoutedEventArgs e)
        {
            try
            {
                VM.OnSearchClick();
            }
            catch (Exception ex)
            {
                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("Ошибка", ex.Message);
                await messageBoxStandardWindow.Show();
            }
        }

        private async void RowResetClick(object sender, RoutedEventArgs e)
        {
            try
            {
                VM.ResetCurrentRow();
            }
            catch (Exception ex)
            {
                var messageBoxStandardWindow = MessageBox.Avalonia.MessageBoxManager
                    .GetMessageBoxStandardWindow("Ошибка", ex.Message);
                await messageBoxStandardWindow.Show();
            }
        }

        // Фильтрация численного ввода для текстовых полей.
        private void OnNumericTextInput(TextBox sender, RoutedEventArgs args)
        {
            TextInputEventArgs Args = args as TextInputEventArgs;

            Args.Handled = 
                Args.Text.Any(c => !char.IsDigit(c))
                ||
                (sender.Text.Length > 8);
        }
    }
}