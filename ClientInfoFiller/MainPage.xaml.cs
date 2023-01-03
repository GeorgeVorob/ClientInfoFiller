using ClientInfoFiller.Models;
using ClientInfoFiller.ViewModels;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;


namespace ClientInfoFiller
{
    public sealed partial class MainPage : Page
    {
        public MainViewModel VM;

        public MainPage()
        {
            VM = new MainViewModel();
            this.InitializeComponent();
        }

        private async void RowSaveClick(object sender, RoutedEventArgs e)
        {
            try
            {
                await VM.OnRowSaveClick();

                ContentDialog tableErrorDialog = new ContentDialog()
                {
                    Title = "Данныe сохранены",
                    CloseButtonText = "Ok"
                };

                await tableErrorDialog.ShowAsync();
            }
            catch(Exception ex)
            {
                ContentDialog tableErrorDialog = new ContentDialog()
                {
                    Title = "Не удалось открыть таблицу",
                    Content = ex.Message,
                    CloseButtonText = "Ok"
                };

                await tableErrorDialog.ShowAsync();
            }
        }

        private async void FileSelectClick(object sender, RoutedEventArgs e)
        {
            await VM.OnFileSelectClick();
        }

        private async void SearchClick(object sender, RoutedEventArgs e)
        {
            await VM.OnSearchClick();
        }

        private void FoundOrderClicked(object sender, ItemClickEventArgs e)
        {
            VM.OnFoundCustomerClick(e.ClickedItem as Row);
        }

        private void RowResetClick(object sender, RoutedEventArgs e)
        {
            VM.ResetCurrentRow();
        }

        // Фильтрация численного ввода для текстовых полей.
        private void TextBox_OnBeforeTextChanging(TextBox sender,
                                          TextBoxBeforeTextChangingEventArgs args)
        {
            args.Cancel = args.NewText.Any(c => !char.IsDigit(c));
        }
    }
}
