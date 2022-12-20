using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Storage.AccessCache;
using Windows.Storage;
using Windows.System;

namespace ClientInfoFiller.Services
{
    public class FileService
    {
        //To remember a file, you can use a method like this
        public string RememberFile(StorageFile file)
        {
            string token = Guid.NewGuid().ToString();
            StorageApplicationPermissions.FutureAccessList.AddOrReplace(token, file);
            return token;
        }

        //To retrieve the file the next time, you can use this:
        public async Task<StorageFile> GetFileForToken(string token)
        {
            try
            {
                if (!StorageApplicationPermissions.FutureAccessList.ContainsItem(token)) return null;
                StorageFile file = await StorageApplicationPermissions.FutureAccessList.GetFileAsync(token);
                return file;
            }
            catch(Exception ex)
            {
                StorageApplicationPermissions.FutureAccessList.Remove(token);
                return null;
            }
        }
    }
}
