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

    }
}
